import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { getStreamUrl } from '../scraper.mjs'
import { cacheClear, cacheStats } from '../providers/cache.js'
import { getActiveSessionCount, getUploadById } from '../db.js'
import { streamFile } from '../lib/r2.js'
import { PLAN_FEATURES } from './planUtils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOWNLOADS_DIR = path.join(__dirname, '..', 'download')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

// LRU segment cache
const segmentCache = new Map()
const SEGMENT_CACHE_MAX = 500
const SEGMENT_CACHE_TTL = 60_000
function cacheSegment(key, data, contentType) {
  if (segmentCache.size >= SEGMENT_CACHE_MAX) {
    const oldest = segmentCache.keys().next().value
    segmentCache.delete(oldest)
  }
  segmentCache.set(key, { data, contentType, time: Date.now() })
}
function getCachedSegment(key) {
  const entry = segmentCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.time > SEGMENT_CACHE_TTL) {
    segmentCache.delete(key)
    return null
  }
  return entry
}

async function parseMasterManifest(masterUrl) {
  const response = await axios.get(masterUrl, {
    headers: { 'User-Agent': UA, Referer: 'https://nextgencloudfabric.com/' },
    timeout: 15000,
  })
  const body = response.data
  const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1)
  const variants = []
  const lines = body.split('\n')
  let currentStreamInf = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#EXT-X-STREAM-INF:')) {
      const bwMatch = trimmed.match(/BANDWIDTH=(\d+)/i)
      const resMatch = trimmed.match(/RESOLUTION=(\d+x\d+)/i)
      currentStreamInf = {
        bandwidth: bwMatch ? parseInt(bwMatch[1]) : 0,
        resolution: resMatch ? resMatch[1] : null,
      }
    } else if (currentStreamInf && trimmed && !trimmed.startsWith('#')) {
      const variantUrl = trimmed.startsWith('http') ? trimmed : new URL(trimmed, baseUrl).href
      variants.push({
        resolution: currentStreamInf.resolution,
        bandwidth: currentStreamInf.bandwidth,
        url: variantUrl,
        label: currentStreamInf.resolution ? `${currentStreamInf.resolution.split('x')[1]}p` : `${Math.round(currentStreamInf.bandwidth / 1000)}kbps`,
      })
      currentStreamInf = null
    }
  }

  variants.sort((a, b) => (parseInt(a.resolution?.split('x')[1]) || 0) - (parseInt(b.resolution?.split('x')[1]) || 0))

  // Apply plan resolution cap
  if (plan && PLAN_MAX_RES[plan] !== undefined) {
    const maxRes = PLAN_MAX_RES[plan]
    const filtered = variants.filter((v) => {
      const height = parseInt(v.resolution?.split('x')[1]) || 0
      return height <= maxRes
    })
    if (filtered.length > 0) variants = filtered
    else if (variants.length > 0) variants = [variants[0]]
  }

  return variants
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}

export async function source(req, res) {
  const { id, type, season, episode } = req.query
  if (!id) return res.status(400).json({ error: 'TMDB ID is required' })

  // Creator uploads: a UUID resolves to a direct R2/S3 file. Serve it directly.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (isUuid || (type === 'creator')) {
    const upload = await getUploadById(id)
    if (upload && upload.filename && upload.status === 'active') {
      return res.json({
        success: true,
        streamUrl: `/api/stream/creator/${id}.mp4`,
        directUrl: `/api/stream/creator/${id}.mp4`,
        embedUrl: null,
        provider: 'creator',
        providerMode: 'file',
        subtitles: [],
        backups: [],
        source: 'creator',
      })
    }
  }

  // Concurrent screen enforcement (skip for anonymous/unauthed)
  if (req.userId && req.userId !== 'anonymous') {
    const plan = req.user?.plan || 'free'
    const maxScreens = PLAN_FEATURES[plan]?.concurrentScreens || 1
    try {
      const activeSessions = await getActiveSessionCount(req.userId)
      if (activeSessions >= maxScreens) {
        return res.status(429).json({
          success: false,
          error: `Your ${plan} plan allows ${maxScreens} concurrent screen${maxScreens > 1 ? 's' : ''}. You've reached this limit.`,
        })
      }
    } catch (e) {
      console.warn('[source] screen check failed:', e.message)
    }
  }

  try {
    let result
    try {
      result = await Promise.race([
        getStreamUrl(id, type || 'movie', season || null, episode || null),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout of 18000ms exceeded')), 18000)),
      ])
    } catch (e) {
      return res.json({ success: false, error: e.message })
    }

    if (result.streamUrl) {
      try {
        const headCheck = await axios({
          url: result.streamUrl,
          method: 'HEAD',
          timeout: 5000,
          validateStatus: () => true,
          headers: { 'User-Agent': UA, Referer: 'https://play.xpass.top/' },
        })
        const ct = (headCheck.headers['content-type'] || '').toLowerCase()
        if (ct.includes('text/html')) {
          console.log(`[source] HLS blocked by CDN (HTML), falling back to embed for ${id}`)
          result.streamUrl = null
          result.providerMode = 'embed'
        }
      } catch {
        // HEAD failed — proceed anyway
      }
    }

    const toProxy = (url) => {
      if (!url) return url
      if (url.startsWith('http://') || url.startsWith('https://')) return url.replace('https://', '/api/proxy/')
      return url
    }

    const streamProxy = result.streamUrl ? `/api/proxy/${result.streamUrl.replace('https://', '')}` : null
    const embedProxy = result.embedUrl ? `/api/proxy-embed?url=${encodeURIComponent(result.embedUrl)}` : null
    const subtitles = (result.subtitles || []).map((s) => ({
      label: s.label,
      file: toProxy(s.file),
    }))

    const backups = (result.backups || []).slice(0, 5).map((b) => ({
      streamUrl: b.streamUrl,
      embedUrl: b.embedUrl,
      provider: b.provider,
      subtitles: (b.subtitles || []).map((s) => ({
        label: s.label,
        file: toProxy(s.file),
      })),
    }))

    const response = {
      success: true,
      streamUrl: streamProxy,
      embedUrl: embedProxy,
      directUrl: result.streamUrl,
      subtitles,
      provider: result.provider,
      providerMode: result.providerMode || (result.streamUrl ? 'hls' : 'embed'),
      backups,
      fromCache: result.fromCache || false,
      elapsed: result.elapsed || 0,
      attempted: result.attempted || 0,
      totalProviders: result.totalProviders || 0,
    }

    res.json(response)
  } catch (err) {
    console.error(`[api/source] id=${id} type=${type || 'movie'} season=${season || '-'} episode=${episode || '-'}: ${err.message}`)
    let releaseDate = null
    try {
      const tmdb = req.app.locals.tmdb
      const tmdbRes = await tmdb.get(`/${type === 'tv' ? 'tv' : 'movie'}/${id}`, {
        params: { language: 'en-US' },
      })
      releaseDate = tmdbRes.data.release_date || tmdbRes.data.first_air_date || null
    } catch {}
    res.json({ success: false, error: err.message, releaseDate })
  }
}

const PLAN_MAX_RES = { free: 480, student: 720, basic: 720, standard: 1080, premium: 2160 }

export async function manifestInfo(req, res) {
  const { url, id, type, season, episode, plan } = req.query
  if (!url) return res.status(400).json({ error: 'URL is required' })

  try {
    const cdnUrl = url.startsWith('/api/proxy/')
      ? 'https://' + url.replace('/api/proxy/', '')
      : url

    const variants = await parseMasterManifest(cdnUrl)
    let duration = 0

    if (id && type) {
      try {
        let runtime = 0
        const tmdb = req.app.locals.tmdb
        if (type === 'tv' && season && episode) {
          const ep = await tmdb.get(`/tv/${id}/season/${season}/episode/${episode}`, { params: { language: 'en-US' } })
          runtime = ep.data.runtime || 0
        }
        if (!runtime) {
          const tm = await tmdb.get(`/${type}/${id}`, { params: { language: 'en-US' } })
          runtime = tm.data.runtime || tm.data.episode_run_time?.[0] || 0
        }
        duration = runtime * 60
      } catch {}
    }

    const compressedRatio = (h) => {
      if (h >= 1080) return 0.30
      if (h >= 720) return 0.35
      if (h >= 480) return 0.40
      return 0.45
    }

    const variantsWithSize = variants.map((v) => {
      const height = parseInt(v.resolution?.split('x')[1]) || 0
      const origBytes = duration > 0 ? Math.round(v.bandwidth / 8 * duration) : 0
      const compBytes = duration > 0 ? Math.round(origBytes * compressedRatio(height)) : 0
      return {
        ...v,
        sizeBytes: origBytes,
        sizeLabel: duration > 0 ? formatSize(origBytes) : 'Unknown',
        compressedBytes: compBytes,
        compressedLabel: duration > 0 ? `~${formatSize(compBytes)}` : 'Unknown',
      }
    })

    res.json({ success: true, duration, variants: variantsWithSize })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
}

const DOWNLOAD_PLANS = { student: true, basic: true, standard: true, premium: true }

export async function download(req, res) {
  const ffmpegPath = req.app.locals.ffmpegPath
  const { url, title, variant, compress, save } = req.query
  if (!url) return res.status(400).json({ error: 'URL is required' })

  if (!DOWNLOAD_PLANS[req.user?.plan]) {
    return res.status(403).json({ error: 'Downloads require a paid plan (Student or higher)' })
  }

  const safeTitle = title
    ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    : 'video'

  try {
    let cdnUrl = url.startsWith('/api/proxy/')
      ? 'https://' + url.replace('/api/proxy/', '')
      : url

    if (variant) {
      cdnUrl = variant
    }

    const cdnHost = new URL(cdnUrl).hostname
    const dlReferer = cdnHost.includes('remoteconsultinggroup') ? 'https://nextgencloudfabric.com/' : cdnHost.includes('tik.1x2') || cdnHost.includes('tiktokcdn') ? 'https://tik.1x2.space/' : 'https://nextgencloudfabric.com/'
    const dlHeaders = `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\nReferer: ${dlReferer}\r\nOrigin: ${dlReferer.replace(/\/$/, '')}\r\n`

    const probeArgs = [
      '-headers', dlHeaders,
      '-allowed_extensions', 'ALL',
      '-t', '1',
      '-i', cdnUrl,
      '-f', 'null',
      '-',
    ]
    const probe = spawn(ffmpegPath, probeArgs, { stdio: ['pipe', 'pipe', 'pipe'] })
    const probeResult = await new Promise((resolve) => {
      let stderr = ''
      probe.stderr.on('data', (d) => { stderr += d.toString() })
      probe.on('close', (code) => resolve({ code, stderr }))
    })
    if (probeResult.code !== 0) {
      console.error('[dl probe] stream not accessible:', probeResult.stderr.slice(0, 300))
      return res.status(400).json({ error: 'Stream not accessible' })
    }

    const outputFilename = `${safeTitle}.mp4`

    if (save === 'true') {
      if (!fs.existsSync(DOWNLOADS_DIR)) {
        fs.mkdirSync(DOWNLOADS_DIR, { recursive: true })
      }
      const outputPath = path.join(DOWNLOADS_DIR, outputFilename)

      const ffArgs = [
        '-headers', dlHeaders,
        '-allowed_extensions', 'ALL',
        '-i', cdnUrl,
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov',
        '-loglevel', 'error',
        '-y',
        outputPath,
      ]

      if (compress === 'true') {
        ffArgs.splice(ffArgs.length - 5, 0,
          '-c:v', 'libx264',
          '-crf', '23',
          '-preset', 'fast',
          '-c:a', 'aac',
          '-b:a', '128k',
        )
      } else {
        ffArgs.splice(ffArgs.length - 5, 0,
          '-c', 'copy',
          '-bsf:a', 'aac_adtstoasc',
        )
      }

      const ffmpeg = spawn(ffmpegPath, ffArgs, { stdio: ['pipe', 'pipe', 'pipe'] })

      let stderrData = ''
      ffmpeg.stderr.on('data', (chunk) => { stderrData += chunk.toString() })
      ffmpeg.stderr.on('end', () => {
        if (stderrData.trim()) console.error('ffmpeg stderr:', stderrData)
      })

      ffmpeg.on('error', (err) => {
        console.error('ffmpeg error:', err.message)
        if (!res.headersSent) res.status(500).json({ error: 'ffmpeg not found', detail: err.message })
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          const stat = fs.statSync(outputPath)
          res.json({ success: true, file: { name: outputFilename, size: stat.size, path: outputPath } })
        } else if (!res.headersSent) {
          console.error('ffmpeg exited with code', code, stderrData)
          res.status(500).json({ error: 'Download failed', code, detail: stderrData.slice(0, 500) })
        }
      })

      req.on('close', () => {
        ffmpeg.kill('SIGTERM')
      })
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`)
      res.setHeader('Content-Type', 'video/mp4')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Transfer-Encoding', 'chunked')

      const ffArgs = [
        '-headers', dlHeaders,
        '-allowed_extensions', 'ALL',
        '-i', cdnUrl,
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov',
        '-loglevel', 'error',
        '-y',
        'pipe:1',
      ]

      if (compress === 'true') {
        ffArgs.splice(ffArgs.length - 4, 0,
          '-c:v', 'libx264',
          '-crf', '23',
          '-preset', 'fast',
          '-c:a', 'aac',
          '-b:a', '128k',
        )
      } else {
        ffArgs.splice(ffArgs.length - 4, 0,
          '-c', 'copy',
          '-bsf:a', 'aac_adtstoasc',
        )
      }

      const ffmpeg = spawn(ffmpegPath, ffArgs, { stdio: ['pipe', 'pipe', 'pipe'] })

      let stderrData = ''
      ffmpeg.stderr.on('data', (chunk) => { stderrData += chunk.toString() })
      ffmpeg.stderr.on('end', () => {
        if (stderrData.trim()) console.error('ffmpeg stderr:', stderrData)
      })

      ffmpeg.stdout.pipe(res)

      ffmpeg.on('error', (err) => {
        console.error('ffmpeg error:', err.message)
        if (!res.headersSent) res.status(500).json({ error: 'ffmpeg not found', detail: err.message })
      })

      ffmpeg.on('close', (code) => {
        if (code !== 0 && !res.headersSent) {
          console.error('ffmpeg exited with code', code, stderrData)
          res.status(500).json({ error: 'Download failed', code, detail: stderrData.slice(0, 500) })
        }
      })

      req.on('close', () => {
        ffmpeg.kill('SIGTERM')
      })
    }
  } catch (err) {
    console.error(err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Download failed' })
  }
}

export async function serveDownloadedFile(req, res) {
  const filename = req.params.filename
  const filePath = path.join(DOWNLOADS_DIR, filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  const stat = fs.statSync(filePath)
  res.setHeader('Content-Type', 'video/mp4')
  res.setHeader('Content-Length', stat.size)
  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
}

function isValidVideoContentType(ct) {
  if (!ct) return false
  const t = ct.toLowerCase()
  return t.startsWith('video/') || t.startsWith('audio/') ||
    t.includes('octet-stream') || t.includes('binary') ||
    t.includes('mpegurl') || t.includes('mp4') ||
    t.includes('m2ts') || t.includes('m3u8')
}

function isSegmentUrl(url) {
  return !url.endsWith('.m3u8') && !url.endsWith('.m3u')
}

async function tryFfmpegFetch(url, ffmpegPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, [
      '-i', url, '-c', 'copy', '-f', 'mpegts', '-loglevel', 'error', 'pipe:1'
    ], { windowsHide: true, timeout: 30000 })
    const chunks = []
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; proc.kill(); reject(new Error('ffmpeg timeout')) }, 25000)
    proc.stdout.on('data', (c) => { if (!timedOut) chunks.push(c) })
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (timedOut) return
      if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks))
      else reject(new Error('ffmpeg failed'))
    })
    proc.on('error', reject)
  })
}

export async function streamCreatorUpload(req, res) {
  const isThumb = /-thumb\.(jpg|jpeg|png|webp)$/i.test(req.params.file || '')
  const id = (req.params.file || '').replace(/\.(mp4|webm|mov|m4v)$/i, '').replace(/-thumb\.(jpg|jpeg|png|webp)$/i, '')
  try {
    const upload = await getUploadById(id)
    const rawUrl = isThumb ? upload?.thumbnail_url : upload?.filename
    if (!upload || !rawUrl || upload.status !== 'active') {
      return res.status(404).json({ error: 'Upload not found' })
    }
    const parsed = new URL(rawUrl)
    const key = parsed.pathname.replace(/^\//, '').split('/').slice(1).join('/')
    const range = req.headers.range
    const result = await streamFile(key, range)
    if (!result.success) return res.status(500).json({ error: result.error })
    if (range) res.status(206)
    res.set({
      'Content-Type': result.contentType || (isThumb ? 'image/jpeg' : 'video/mp4'),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000',
    })
    if (result.contentLength) res.set('Content-Length', range ? undefined : String(result.contentLength))
    if (result.contentRange) res.set('Content-Range', result.contentRange)
    result.stream.pipe(res)
  } catch (err) {
    console.error('[stream-creator] Error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

export async function proxy(req, res) {
  const fullPath = req.params[0]
  if (!fullPath) return res.status(400).send('path required')

  const url = 'https://' + fullPath
  let hostname = ''
  try { hostname = new URL(url).hostname } catch { return res.status(502).send('Invalid URL') }

  // Check segment cache for non-m3u8 URLs
  const isM3u8 = url.endsWith('.m3u8') || url.endsWith('.m3u')
  if (!isM3u8) {
    const cached = getCachedSegment(url)
    if (cached) {
      res.setHeader('Content-Type', cached.contentType)
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', '*')
      return res.send(cached.data)
    }
  }

  const referers = [
    'https://nextgencloudfabric.com/',
    'https://play.xpass.top/',
    'https://tik.1x2.space/',
    'https://p16-sg.tiktokcdn.com/',
  ]

  const tryFetch = async (ref) => {
    console.log(`[proxy] FETCH ${url.substring(0,120)}... ref=${ref || 'none'}`)
    return axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: url.endsWith('.m3u8') ? 15000 : 10000,
      headers: {
        'User-Agent': UA,
        Referer: ref,
        Origin: ref.replace(/\/$/, ''),
      },
    })
  }

  let response = null
  let usedReferer = ''

  // Retry loop: up to 2 attempts for segment requests
  const MAX_ATTEMPTS = isM3u8 ? 1 : 2
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) console.log(`[proxy] retry ${attempt} for ${hostname}`)

    try {
      const bareResp = await axios({ url, method: 'GET', responseType: 'stream', timeout: 5000 })
      const bct = bareResp.headers['content-type'] || ''
      if (bareResp.status === 200 && (isValidVideoContentType(bct) || bct.includes('text/plain') || (isSegmentUrl(url) && !bct.includes('text/html')))) {
        response = bareResp
        usedReferer = 'bare'
        console.log('[proxy] bare curl-style fetch succeeded for', hostname)
        break
      } else { if (bareResp.data) bareResp.data.destroy() }
    } catch {}

    if (!response) for (const ref of referers) {
      try {
        const resp = await tryFetch(ref)
        console.log(`[proxy] RESP ${resp.status} ${resp.headers['content-type']} ref=${ref || 'none'}`)
        if (resp.status === 200) {
          const ct = resp.headers['content-type'] || ''
          if (isValidVideoContentType(ct) || ct.includes('text/plain') || (isSegmentUrl(url) && !ct.includes('text/html'))) {
            response = resp
            usedReferer = ref
            break
          }
          if (ct.includes('text/html')) {
            let snippet = ''
            resp.data.on('data', (c) => { snippet += c.toString().substring(0, 200); resp.data.destroy() })
            resp.data.on('end', () => console.log(`[proxy] ${hostname} returned HTML from ${ref}: ${snippet.substring(0, 100)}...`))
            resp.data.resume()
          } else {
            console.log(`[proxy] bad content-type ${ct} from ${ref} for ${hostname}`)
            resp.data.destroy()
          }
        }
      } catch (e) {
        console.log(`[proxy] fetch error from ${ref}: ${e.message}`)
      }
    }

    if (response) break
    if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, 1000))
  }

  if (!response) {
    console.log('[proxy] trying ffmpeg fallback for', hostname)
    try {
      const ffmpegData = await tryFfmpegFetch(url, req.app.locals.ffmpegPath)
      res.setHeader('Content-Type', 'video/mp2t')
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', '*')
      return res.send(ffmpegData)
    } catch (ffErr) {
      console.error('[proxy] ffmpeg fallback also failed for', hostname)
    }
  }

  if (!response) {
    console.error(`[proxy] All proxy strategies failed for ${hostname} url=${url.substring(0,100)}`)
    return res.status(502).send('Proxy failed')
  }

  try {
    const contentType = response.headers['content-type'] || ''
    res.setHeader('Content-Type', contentType)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')

    if (contentType.includes('m3u8') || contentType.includes('application/vnd.apple.mpegurl')) {
      let body = ''
      response.data.on('data', (chunk) => { body += chunk.toString() })
      response.data.on('end', () => {
        const baseUrl = url.substring(0, url.lastIndexOf('/') + 1)
        const rewritten = body.split('\n').map((line) => {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) return line
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            return line.replace('https://', '/api/proxy/')
          }
          const resolved = new URL(trimmed, baseUrl).href
          return resolved.replace('https://', '/api/proxy/')
        }).join('\n')
        res.send(rewritten)
      })
    } else {
      // Buffer segment for caching
      const chunks = []
      response.data.on('data', (c) => chunks.push(c))
      response.data.on('end', () => {
        const buf = Buffer.concat(chunks)
        cacheSegment(url, buf, contentType)
        res.send(buf)
      })
      response.data.on('error', (err) => {
        console.error('[proxy] segment stream error:', err.message)
        if (!res.headersSent) res.status(502).send('Segment fetch failed')
      })
    }
  } catch (err) {
    console.error('[proxy] stream error:', err.message)
    if (!res.headersSent) res.status(500).send('Proxy stream failed')
  }
}

const AD_PATTERNS = [
  'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
  'popads.net', 'propellerads.com', 'adsterra.com', 'exoclick.com',
  'adf.ly', 'adfly', 'adserver', 'adnxs.com', 'rubiconproject.com',
  'criteo.com', 'outbrain.com', 'taboola.com', 'revcontent.com',
  'popcash.net', 'pushcrew.com', 'onesignal.com',
  'advertising', 'ad-plus', 'ad_', '-ad.', '/ads/',
  'pagead2.googlesyndication',
]

function stripAds(html) {
  let cleaned = html

  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script\s*>/gi, (match) => {
    const lower = match.toLowerCase()
    for (const ad of AD_PATTERNS) {
      if (lower.includes(ad)) return ''
    }
    if (lower.includes('window.open') || lower.includes('popup') || lower.includes('open.new')) return ''
    return match
  })

  cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe\s*>/gi, (match) => {
    const lower = match.toLowerCase()
    for (const ad of AD_PATTERNS) {
      if (lower.includes(ad)) return ''
    }
    if (lower.includes('window.open') || lower.match(/src\s*=\s*["'][^"']*about:/i)) return ''
    return match
  })

  cleaned = cleaned.replace(/\s+onclick\s*=\s*["'][^"']*["']/gi, '')
  cleaned = cleaned.replace(/\s+onload\s*=\s*["'][^"']*["']/gi, '')
  cleaned = cleaned.replace(/\s+onerror\s*=\s*["'][^"']*["']/gi, '')
  cleaned = cleaned.replace(/\s+onmouseover\s*=\s*["'][^"']*["']/gi, '')
  cleaned = cleaned.replace(/\s+onmousedown\s*=\s*["'][^"']*["']/gi, '')

  cleaned = cleaned.replace(/<div[^>]*id="[^"]*"?[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>[\s\S]*?<\/div\s*>/gi, '')
  cleaned = cleaned.replace(/<ins\s+class="adsbygoogle"[\s\S]*?<\/ins\s*>/gi, '')
  cleaned = cleaned.replace(/<script[^>]*data-ad-[\s\S]*?<\/script\s*>/gi, '')

  return cleaned
}

export async function proxyEmbed(req, res) {
  const { url: embedUrl } = req.query
  if (!embedUrl) return res.status(400).json({ error: 'embedUrl required' })

  try {
    const pageRes = await axios.get(embedUrl, {
      headers: {
        'User-Agent': UA,
        Referer: embedUrl,
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
      validateStatus: () => true,
      responseType: 'text',
    })

    if (pageRes.status !== 200) {
      return res.status(502).json({ error: `Embed returned ${pageRes.status}` })
    }

    const cleaned = stripAds(pageRes.data)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.send(cleaned)
  } catch (err) {
    console.error('[proxy-embed] error:', err.message)
    res.status(502).json({ error: 'Failed to fetch embed' })
  }
}
