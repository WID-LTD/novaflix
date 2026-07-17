import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { getStreamUrl } from '../scraper.mjs'
import { getActiveSessionCount } from '../db.js'
import { PLAN_FEATURES } from './planUtils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOWNLOADS_DIR = path.join(__dirname, '..', 'download')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

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

  // Concurrent screen enforcement
  const plan = req.user?.plan || 'free'
  const maxScreens = PLAN_FEATURES[plan]?.concurrentScreens || 1
  const activeSessions = await getActiveSessionCount(req.userId)
  if (activeSessions >= maxScreens) {
    return res.status(429).json({
      success: false,
      error: `Your ${plan} plan allows ${maxScreens} concurrent screen${maxScreens > 1 ? 's' : ''}. You've reached this limit.`,
    })
  }

  try {
    const result = await getStreamUrl(id, type || 'movie', season || null, episode || null)
    const proxyUrl = `/api/proxy/${result.streamUrl.replace('https://', '')}`
    const subtitles = (result.subtitles || []).map((s) => ({
      label: s.label,
      file: s.file.replace('https://', '/api/proxy/'),
    }))
    res.json({ success: true, streamUrl: proxyUrl, directUrl: result.streamUrl, subtitles })
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

export async function proxy(req, res) {
  const fullPath = req.params[0]
  if (!fullPath) return res.status(400).send('path required')

  const url = 'https://' + fullPath
  const hostname = new URL(url).hostname

  const referers = [
    'https://tik.1x2.space/',
    'https://nextgencloudfabric.com/',
    'https://play.xpass.top/',
    'https://p16-sg.tiktokcdn.com/',
  ]

  const tryFetch = async (ref) => {
    return axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: ref,
        Origin: ref.replace(/\/$/, ''),
      },
    })
  }

  let response = null
  for (const ref of referers) {
    try {
      response = await tryFetch(ref)
      if (response.status === 200) break
    } catch {}
  }

  if (!response || response.status !== 200) {
    console.error('[proxy] failed all referers for', hostname)
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
      response.data.pipe(res)
    }
  } catch (err) {
    console.error('[proxy] stream error:', err.message)
    if (!res.headersSent) res.status(500).send('Proxy stream failed')
  }
}
