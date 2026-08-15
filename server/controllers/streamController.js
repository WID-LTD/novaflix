import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { getStreamUrl } from '../scraper.mjs'
import { cacheClear, cacheStats } from '../providers/cache.js'
import { reportFailure, reportSuccess } from '../providers/providerHealth.js'
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

async function parseMasterManifest(masterUrl, plan) {
  const response = await axios.get(masterUrl, {
    headers: headersForStream(masterUrl),
    timeout: 15000,
  })
  const body = response.data
  const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/') + 1)
  let variants = []
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

function hostOf(url) {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

// Maps a CDN host to the Referer it expects. Clients attach these headers when
// playing a stream directly (bypassing the Render-hosted proxy, which these
// CDNs routinely block).
function refererForHost(host) {
  if (!host) return 'https://nextgencloudfabric.com/'
  if (host.includes('1x2.space') || host.includes('meadowlane') || host.includes('ibyteimg')) {
    return 'https://play.xpass.top/'
  }
  if (host.includes('shegu') || host.includes('febbox')) return 'https://febbox.com/'
  if (host.includes('nextgencloudfabric') || host.includes('remoteconsulting')) return 'https://nextgencloudfabric.com/'
  if (host.includes('xpass')) return 'https://play.xpass.top/'
  return 'https://nextgencloudfabric.com/'
}

function headersForStream(url) {
  const referer = refererForHost(hostOf(url))
  return {
    'User-Agent': UA,
    Referer: referer,
    Origin: referer.replace(/\/$/, ''),
  }
}

// Merge cookies captured during probing into the playback headers. Some CDNs
// authorize real (non-ad) segments only after a session cookie is set.
function headersWithCookies(url, cookies) {
  const h = headersForStream(url)
  const cs = (cookies || []).filter(Boolean)
  if (cs.length) h.Cookie = cs.join('; ')
  return h
}

const PROBE_CACHE_MAX = 200
const PROBE_CACHE_TTL = 60 * 1000
const probeCache = new Map()
function cacheProbe(url, result) {
  if (probeCache.size >= PROBE_CACHE_MAX) {
    const oldest = probeCache.keys().next().value
    probeCache.delete(oldest)
  }
  probeCache.set(url, { result, ts: Date.now() })
}
function getCachedProbe(url) {
  const entry = probeCache.get(url)
  if (!entry) return null
  if (Date.now() - entry.ts > PROBE_CACHE_TTL) {
    probeCache.delete(url)
    return null
  }
  return entry.result
}

function setCookieFrom(headers, collect) {
  try {
    const sc = headers['set-cookie']
    if (!sc) return
    const list = Array.isArray(sc) ? sc : [sc]
    for (const c of list) {
      const name = String(c).split('=')[0]
      if (name && name.trim() && !collect.some((x) => x.startsWith(name + '='))) {
        collect.push(String(c).split(';')[0].trim())
      }
    }
  } catch {}
}

// MPEG-TS packets are 188 bytes and every packet starts with the 0x47 sync
// byte. Ad-placeholder PNGs never exhibit this pattern, so it is definitive
// proof of real video without needing ffmpeg.
function looksLikeTsVideo(buf) {
  if (!buf || buf.length < 188 * 2) return false
  const max = Math.min(10, Math.floor(buf.length / 188))
  for (let i = 0; i < max; i++) {
    if (buf[i * 188] !== 0x47) return false
  }
  return true
}

function looksLikeMp4(buf) {
  return !!buf && buf.length > 12 && buf.subarray(4, 8).toString('latin1') === 'ftyp'
}

function looksLikeImage(buf) {
  if (!buf || buf.length < 12) return false
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true // PNG
  if (buf[0] === 0xff && buf[1] === 0xd8) return true // JPEG
  if (buf.toString('latin1', 0, 4) === 'GIF8') return true // GIF
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return true // WEBP
  return false
}

// Fetch the first ~4KB of a URL so segment bytes can be inspected (Range is
// advisory; some CDNs return the whole body, which is fine for a probe).
async function fetchPrefix(url, headers, extra = {}) {
  try {
    const res = await axios({
      url,
      method: 'GET',
      headers: { ...headers, Range: 'bytes=0-4095', ...extra },
      timeout: 6000,
      maxRedirects: 5,
      validateStatus: () => true,
      responseType: 'arraybuffer',
    })
    return {
      status: res.status,
      ct: (res.headers['content-type'] || '').toLowerCase(),
      buf: Buffer.from(res.data || []),
      headers: res.headers,
    }
  } catch {
    return { status: 0, ct: '', buf: Buffer.alloc(0), headers: {} }
  }
}

// Byte-level verification with ffmpeg. Content-type checks are fooled by
// ad-only CDNs that serve 1x1 PNG segments under a video/* content-type.
// ffmpeg fails to find a decodable video codec in those cases. Also captures
// the real Duration so a bogus-length playlist can be rejected.
function ffmpegProbePlayable(streamUrl, headers, ffmpegPath) {
  return new Promise((resolve) => {
    const hdrStr = Object.entries(headers || {})
      .map(([k, v]) => `${k}: ${v}\r\n`)
      .join('')
    const args = [
      '-headers', hdrStr,
      '-allowed_extensions', 'ALL',
      '-t', '2',
      '-i', streamUrl,
      '-f', 'null',
      '-',
    ]
    let stderr = ''
    let probe
    try {
      probe = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    } catch (e) {
      return resolve({ ok: false, reason: 'ffmpeg-spawn-error', detail: String(e.message || e).slice(0, 100) })
    }
    const killer = setTimeout(() => {
      try { probe.kill('SIGKILL') } catch {}
    }, 12000)
    probe.stderr.on('data', (d) => {
      stderr += d.toString()
      if (stderr.length > 6000) stderr = stderr.slice(-6000)
    })
    probe.on('close', (code) => {
      clearTimeout(killer)
      const hasVideo = /Stream #\d+:\d+(?:\(\d+\))?: Video: (h264|hevc|av1|vp9|mpeg2video|mpeg4|vp8|vc1)/i.test(stderr)
      const hasError = /(Invalid data found|error while decoding|unable to decode|no video stream|could not find codec|decoder not found|failed to open|https protocol not found|HTTP error|not found|Forbidden|Access Denied)/i.test(stderr)
      const durMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
      const duration = durMatch
        ? parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3])
        : 0
      if (code === 0 && hasVideo) {
        resolve({ ok: true, reason: 'ok', duration, hasVideo })
      } else if (code === 0 && !hasVideo) {
        resolve({ ok: false, reason: 'ad-only', detail: 'no decodable video stream', hasVideo: false, duration })
      } else {
        resolve({
          ok: false,
          reason: /404|not found/i.test(stderr) ? 'expired' : hasError ? 'unplayable' : 'ad-only',
          detail: `${code === null ? 'timeout' : 'exit ' + code}: ${stderr.slice(-200)}`,
          duration,
        })
      }
    })
    probe.on('error', (e) => {
      clearTimeout(killer)
      resolve({ ok: false, reason: 'ffmpeg-error', detail: String(e.message || e).slice(0, 100) })
    })
  })
}

// Health check for an HLS/direct stream. Free-tier CDNs serve playlists whose
// "segments" are 1x1 PNG ad-images (unplayable) or return expired 404s /
// anti-bot blocks; the player then sits on a black screen showing a (fake)
// duration. This walks master -> variant -> segment, captures Set-Cookie (some
// CDNs authorize real segments only after a cookie is set), then runs a 2s
// ffmpeg decode to confirm a real video stream exists.
async function probeStreamUrl(streamUrl, ffmpegPath) {
  const cached = getCachedProbe(streamUrl)
  if (cached) return cached
  const started = Date.now()
  const result = await probeStreamUrlUncached(streamUrl, ffmpegPath)
  result.ms = Date.now() - started
  cacheProbe(streamUrl, result)
  console.log(`[probe] ${result.ok ? 'OK' : 'FAIL'} reason=${result.reason} ${streamUrl.substring(0, 90)} (${result.ms}ms)${result.duration ? ` dur=${result.duration}s` : ''}`)
  return result
}

async function probeStreamUrlUncached(streamUrl, ffmpegPath) {
  const hdrs = headersForStream(streamUrl)
  const steps = []
  const cookies = []
  const fetchOpts = (timeout) => ({
    headers: hdrs,
    timeout,
    maxRedirects: 5,
    validateStatus: (s) => s >= 200 && s < 400,
    responseType: 'text',
  })
  const push = (s) => { steps.push(s); console.log(`[probe:step] ${s}`) }

  try {
    let master = null
    try {
      master = await axios.get(streamUrl, fetchOpts(5000))
    } catch (firstErr) {
      // CDNs are flaky; retry once before giving up.
      master = await axios.get(streamUrl, fetchOpts(6000))
    }
    setCookieFrom(master.headers, cookies)
    if (master.status !== 200) return { ok: false, reason: master.status === 404 ? 'expired' : 'blocked', status: master.status, steps }
    const body = String(master.data || '')
    const ct = (master.headers['content-type'] || '').toLowerCase()
    const isM3u8 = body.includes('#EXTM3U') || ct.includes('mpegurl') || ct.includes('m3u8')
    push(`master ${master.status} ct=${ct} bytes=${body.length} cookies=${cookies.join(',') || 'none'}`)

    if (!isM3u8) {
      if (ct.startsWith('image/')) return { ok: false, reason: 'ad-only', ct, steps }
      if (ct.startsWith('video/') || ct.includes('octet-stream') || ct.includes('mp4')) {
        const pre = await fetchPrefix(streamUrl, hdrs)
        push(`direct-prefix ${pre.status} ct=${pre.ct} bytes=${pre.buf.length}`)
        if (looksLikeTsVideo(pre.buf) || looksLikeMp4(pre.buf)) {
          return { ok: true, reason: 'ok', ct, steps }
        }
        if (looksLikeImage(pre.buf)) return { ok: false, reason: 'ad-only', ct, steps }
        const ff = await ffmpegProbePlayable(streamUrl, hdrs, ffmpegPath)
        push(`ffmpeg(mp4) ok=${ff.ok} ${ff.detail || ''}`)
        return { ok: ff.ok, reason: ff.ok ? 'ok' : ff.reason, duration: ff.duration, ct, steps, ...(ff.ok ? {} : { detail: ff.detail }) }
      }
      return { ok: false, reason: 'unknown-type', ct, steps }
    }

    const masterBase = streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1)
    const variantLine = body.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#'))
    if (!variantLine) return { ok: false, reason: 'no-variants', steps }
    const variantUrl = variantLine.startsWith('http') ? variantLine : new URL(variantLine, masterBase).href

    const variant = await axios.get(variantUrl, fetchOpts(5000))
    setCookieFrom(variant.headers, cookies)
    if (variant.status !== 200) return { ok: false, reason: variant.status === 404 ? 'expired' : 'blocked', status: variant.status, steps }
    const vbody = String(variant.data || '')
    const vct = (variant.headers['content-type'] || '').toLowerCase()
    push(`variant ${variant.status} ct=${vct} bytes=${vbody.length}`)
    const segLine = vbody.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#'))
    if (!segLine) return { ok: false, reason: 'no-segments', steps }
    const variantBase = variantUrl.substring(0, variantUrl.lastIndexOf('/') + 1)
    const segUrl = segLine.startsWith('http') ? segLine : new URL(segLine, variantBase).href

    const seg = await fetchPrefix(segUrl, hdrs)
    setCookieFrom(seg.headers, cookies)
    if (seg.status !== 200 && seg.status !== 206) return { ok: false, reason: seg.status === 404 ? 'expired' : 'blocked', status: seg.status, steps }
    const sct = seg.ct
    push(`segment ${seg.status} ct=${sct} bytes=${seg.buf.length} cookies=${cookies.join(',') || 'none'}`)
    if (sct.startsWith('image/') || looksLikeImage(seg.buf)) return { ok: false, reason: 'ad-only', ct: sct, steps }
    if (sct.startsWith('text/html')) return { ok: false, reason: 'blocked', ct: sct, steps }

    // Real MPEG-TS/MP4 segments are provable from their bytes alone; ffmpeg is
    // only needed for ambiguous payloads (some CDNs serve PNG ad-images with a
    // video/* content-type, and those never carry TS sync bytes / ftyp).
    if (looksLikeTsVideo(seg.buf) || looksLikeMp4(seg.buf)) {
      return { ok: true, reason: 'ok', ct: sct, cookies, steps }
    }

    const ff = await ffmpegProbePlayable(streamUrl, { ...hdrs, ...(cookies.length ? { Cookie: cookies.join('; ') } : {}) }, ffmpegPath)
    push(`ffmpeg ok=${ff.ok} codec=${ff.hasVideo ? 'video' : 'none'} dur=${ff.duration ? ff.duration + 's' : 'unknown'} ${ff.detail || ''}`)
    return {
      ok: ff.ok,
      reason: ff.ok ? 'ok' : ff.reason,
      duration: ff.duration,
      ct: sct,
      cookies,
      steps,
      ...(ff.ok ? {} : { detail: ff.detail }),
    }
  } catch (err) {
    const codes = err.errors ? err.errors.map((e) => e.code || e.message).filter(Boolean).slice(0, 3) : []
    return {
      ok: false,
      reason: 'unreachable',
      error: `${err.code || err.message || 'unknown'}${codes.length ? ' [' + codes.join(', ') + ']' : ''}`.slice(0, 160),
      steps,
    }
  }
}

const EMBED_RESOLVE_MAX = 200
const EMBED_RESOLVE_TTL = 60 * 1000
const embedResolveCache = new Map()

// Resolves a JW Player embed page into a direct HLS/MP4 stream so native
// clients (desktop app) can play embed fallbacks without a browser. Returns
// { ok:false, reason } when the embed has no playable source (e.g. /video/error).
async function resolveEmbedStream(embedUrl) {
  const cached = embedResolveCache.get(embedUrl)
  if (cached && Date.now() - cached.ts < EMBED_RESOLVE_TTL) return cached.result
  const result = await resolveEmbedStreamUncached(embedUrl)
  if (embedResolveCache.size >= EMBED_RESOLVE_MAX) embedResolveCache.clear()
  embedResolveCache.set(embedUrl, { result, ts: Date.now() })
  return result
}

async function resolveEmbedStreamUncached(embedUrl) {
  try {
    const pageRes = await axios.get(embedUrl, {
      headers: { 'User-Agent': UA, Referer: embedUrl, Accept: 'text/html' },
      timeout: 8000,
      validateStatus: () => true,
      responseType: 'text',
    })
    const html = typeof pageRes.data === 'string' ? pageRes.data : JSON.stringify(pageRes.data)
    const pm = html.match(/"playlist"\s*:\s*"([^"]+)/)
    if (!pm) return { ok: false, reason: 'no-playlist' }

    const playlistUrl = new URL(pm[1], embedUrl).href
    const plRes = await axios.get(playlistUrl, {
      headers: { 'User-Agent': UA, Referer: embedUrl },
      timeout: 8000,
      validateStatus: () => true,
      responseType: 'text',
    })
    if (plRes.status !== 200) return { ok: false, reason: `playlist ${plRes.status}` }

    let pl = plRes.data
    if (typeof pl === 'string') {
      try {
        pl = JSON.parse(pl)
      } catch {
        return { ok: false, reason: 'bad-playlist-json' }
      }
    }
    const file = pl?.playlist?.[0]?.sources?.[0]?.file
    if (!file) return { ok: false, reason: 'no-source' }
    if (String(file).includes('/video/error') || String(file).includes('/error')) {
      return { ok: false, reason: 'unavailable' }
    }
    if (!String(file).includes('.m3u8') && !String(file).includes('.mp4')) {
      return { ok: false, reason: `non-stream: ${String(file).slice(0, 30)}` }
    }

    const streamUrl = new URL(file, playlistUrl).href
    const cookies = []
    const setCookies = plRes.headers['set-cookie']
    if (setCookies) {
      for (const c of Array.isArray(setCookies) ? setCookies : [setCookies]) {
        cookies.push(String(c).split(';')[0])
      }
    }
    return { ok: true, streamUrl, headers: headersWithCookies(streamUrl, cookies) }
  } catch (e) {
    return { ok: false, reason: `error: ${e.message?.slice(0, 40) || 'unknown'}` }
  }
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
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout of 45000ms exceeded')), 45000)),
      ])
    } catch (e) {
      return res.json({ success: false, error: e.message })
    }

    const toProxy = (url) => {
      if (!url) return url
      if (url.startsWith('http://') || url.startsWith('https://')) return url.replace('https://', '/api/proxy/')
      return url
    }

    const probeResults = []
    const ffmpegPath = req.app.locals.ffmpegPath
    const primary = result.streamUrl
      ? { streamUrl: result.streamUrl, provider: result.provider, subtitles: result.subtitles || [] }
      : null
    const backupList = (result.backups || []).filter((b) => b.streamUrl)
    let chosen = primary
    let chosenProbe = null

    if (chosen) {
      const primaryProbe = await probeStreamUrl(chosen.streamUrl, ffmpegPath)
      probeResults.push({ provider: chosen.provider, host: hostOf(chosen.streamUrl), streamUrl: chosen.streamUrl, ...primaryProbe })
      if (primaryProbe.ok) {
        reportSuccess(chosen.streamUrl)
        chosenProbe = primaryProbe
      } else {
        if (!['blocked'].includes(primaryProbe.reason)) reportFailure(chosen.streamUrl, primaryProbe.reason)
        chosen = null
      }
    }

    if (!chosen && backupList.length > 0) {
      // Verify-before-serve: probe every backup in parallel and take the first
      // stream that actually delivers real video (rejecting ad-only/expired/dead).
      const backupProbes = await Promise.allSettled(
        backupList.map(async (b) => {
          const bp = await probeStreamUrl(b.streamUrl, ffmpegPath)
          probeResults.push({ provider: b.provider, host: hostOf(b.streamUrl), streamUrl: b.streamUrl, ...bp })
          if (bp.ok) reportSuccess(b.streamUrl)
          else if (!['blocked'].includes(bp.reason)) reportFailure(b.streamUrl, bp.reason)
          return { b, bp }
        })
      )
      const verified = backupProbes
        .filter((x) => x.status === 'fulfilled' && x.value && x.value.bp.ok)
        .map((x) => x.value)
      if (verified.length > 0) {
        chosen = {
          streamUrl: verified[0].b.streamUrl,
          provider: verified[0].b.provider,
          subtitles: verified[0].b.subtitles || [],
        }
        chosenProbe = verified[0].bp
      }
    }

    const probeSteps = probeResults.flatMap((r) => (r.steps || []).map((s) => `[${r.provider}] ${s}`))

    if (!chosen || !chosen.streamUrl) {
      const embedProxy = (u) => `/api/proxy-embed?url=${encodeURIComponent(u)}`
      const embedCandidates = []
      if (result.embedUrl) embedCandidates.push({ url: result.embedUrl, provider: result.provider })
      for (const b of result.backups || []) {
        if (b.embedUrl && embedCandidates.length < 3) embedCandidates.push({ url: b.embedUrl, provider: b.provider })
      }

      if (embedCandidates.length > 0) {
        console.log(`[api/source] id=${id} type=${type || 'movie'} -> embed fallback (${probeResults.map((r) => r.reason).join(', ')})`)
        const attempts = await Promise.allSettled(
          embedCandidates.map(async (c) => ({ c, resolved: await resolveEmbedStream(c.url) }))
        )
        const ok = attempts.find((a) => a.status === 'fulfilled' && a.value?.resolved?.ok && a.value.resolved.streamUrl)
        if (ok) {
          const { c, resolved } = ok.value
          console.log(`[api/source] id=${id} embed resolved -> ${resolved.streamUrl.slice(0, 60)}`)
          return res.json({
            success: true,
            streamUrl: `/api/proxy/${resolved.streamUrl.replace('https://', '')}`,
            embedUrl: embedProxy(c.url),
            directUrl: resolved.streamUrl,
            headers: resolved.headers,
            subtitles: (result.subtitles || []).map((s) => ({ label: s.label, file: toProxy(s.file) })),
            provider: c.provider,
            providerMode: 'hls',
            backups: [],
            probe: probeResults,
            debug: { steps: [...probeSteps, `[embed] resolved ${resolved.streamUrl.slice(0, 80)}`] },
            fromCache: result.fromCache || false,
            elapsed: result.elapsed || 0,
            attempted: result.attempted || 0,
            totalProviders: result.totalProviders || 0,
          })
        }
        const reason = attempts
          .map((a) => (a.status === 'fulfilled' ? a.value.resolved.reason : String(a.reason?.message || a.reason)))
          .filter(Boolean)
          .join('; ')
        console.log(`[api/source] id=${id} embed not resolvable (${reason}) -> embed page`)
        return res.json({
          success: true,
          streamUrl: null,
          embedUrl: embedProxy(result.embedUrl),
          directUrl: null,
          headers: null,
          subtitles: (result.subtitles || []).map((s) => ({ label: s.label, file: toProxy(s.file) })),
          provider: result.provider,
          providerMode: 'embed',
          backups: [],
          probe: probeResults,
          debug: { steps: [...probeSteps, `[embed] resolve failed: ${reason}`] },
          fromCache: result.fromCache || false,
          elapsed: result.elapsed || 0,
          attempted: result.attempted || 0,
          totalProviders: result.totalProviders || 0,
        })
      }

      // Failures that are universal (the stream itself is bad) vs. failures that
      // may be server-IP-specific (CDN blocking Render's datacenter). For the
      // latter, still hand native clients the direct URL + headers so they can
      // try from their residential IP; the proxy path stays dead either way.
      const primaryReason = probeResults[0]?.reason || ''
      const softFail = ['blocked', 'unreachable'].includes(primaryReason)
      if (softFail && result.streamUrl) {
        const softHeaders = headersWithCookies(result.streamUrl, probeResults[0]?.cookies)
        console.warn(`[api/source] id=${id} type=${type || 'movie'} -> soft fail (${primaryReason}), handing direct URL to native clients`)
        return res.json({
          success: true,
          streamUrl: `/api/proxy/${result.streamUrl.replace('https://', '')}`,
          embedUrl: result.embedUrl ? `/api/proxy-embed?url=${encodeURIComponent(result.embedUrl)}` : null,
          directUrl: result.streamUrl,
          headers: softHeaders,
          subtitles: (result.subtitles || []).map((s) => ({ label: s.label, file: toProxy(s.file) })),
          provider: result.provider,
          providerMode: 'direct',
          backups: [],
          probe: probeResults,
          debug: { steps: probeSteps },
          fromCache: result.fromCache || false,
          elapsed: result.elapsed || 0,
          attempted: result.attempted || 0,
          totalProviders: result.totalProviders || 0,
        })
      }

      const reasons = probeResults.length > 0 ? probeResults.map((r) => r.reason).join(', ') : 'no stream source'
      console.error(`[api/source] no playable source for id=${id} type=${type || 'movie'} season=${season || '-'} episode=${episode || '-'} reasons=${reasons}`)
      return res.json({
        success: false,
        error: reasons.includes('ad-only')
          ? 'This title is currently serving ad placeholders and cannot be played. Try again later or pick another title.'
          : reasons.includes('expired')
            ? 'The stream link for this title has expired. Try again in a moment.'
            : reasons.includes('blocked')
              ? 'The stream provider is blocking playback for this title.'
              : 'No playable stream source was found for this title.',
        probe: probeResults,
        debug: { steps: probeSteps },
        attempted: result.attempted || 0,
        totalProviders: result.totalProviders || 0,
        fromCache: result.fromCache || false,
      })
    }

    const streamProxy = `/api/proxy/${chosen.streamUrl.replace('https://', '')}`
    const embedProxy = result.embedUrl ? `/api/proxy-embed?url=${encodeURIComponent(result.embedUrl)}` : null
    const subtitles = (chosen.subtitles || []).map((s) => ({
      label: s.label,
      file: toProxy(s.file),
    }))

    const backupHeaders = (url) => {
      const bp = probeResults.find((r) => r.ok && r.streamUrl === url)
      return headersWithCookies(url, bp?.cookies)
    }

    const backups = (result.backups || []).slice(0, 5).map((b) => ({
      streamUrl: b.streamUrl,
      embedUrl: b.embedUrl,
      provider: b.provider,
      directUrl: b.streamUrl || null,
      headers: b.streamUrl ? backupHeaders(b.streamUrl) : null,
      subtitles: (b.subtitles || []).map((s) => ({
        label: s.label,
        file: toProxy(s.file),
      })),
    }))

    const playHeaders = headersWithCookies(chosen.streamUrl, chosenProbe?.cookies)

    const response = {
      success: true,
      streamUrl: streamProxy,
      embedUrl: embedProxy,
      directUrl: chosen.streamUrl,
      headers: playHeaders,
      duration: chosenProbe?.duration || null,
      subtitles,
      provider: chosen.provider,
      providerMode: 'hls',
      backups,
      probe: probeResults,
      debug: { steps: probeSteps },
      fromCache: result.fromCache || false,
      elapsed: result.elapsed || 0,
      attempted: result.attempted || 0,
      totalProviders: result.totalProviders || 0,
    }

    console.log(`[api/source] id=${id} type=${type || 'movie'} season=${season || '-'} episode=${episode || '-'} -> provider=${response.provider} mode=hls dur=${response.duration || 'unknown'}s probe=${JSON.stringify(probeResults.map((r) => r.reason))} cookies=${(chosenProbe?.cookies || []).length}`)
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

    const variants = await parseMasterManifest(cdnUrl, plan)
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
  const path = url.split('?')[0]
  return !path.endsWith('.m3u8') && !path.endsWith('.m3u')
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
  // Rebuild the full upstream URL from the original request so query strings
  // (e.g. tnmr.org's required ?t=&s=&e= token) survive. req.params only holds
  // the path portion; the query is parsed into req.query and would be lost.
  const PROXY_PREFIX = '/api/proxy/'
  const marker = req.originalUrl.indexOf(PROXY_PREFIX)
  const rawPath = marker >= 0
    ? req.originalUrl.slice(marker + PROXY_PREFIX.length)
    : req.params[0]

  const url = 'https://' + rawPath
  let hostname = ''
  try { hostname = new URL(url).hostname } catch { return res.status(502).send('Invalid URL') }

  // Check segment cache for non-m3u8 URLs
  const isM3u8 = url.split('?')[0].endsWith('.m3u8') || url.split('?')[0].endsWith('.m3u')
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
