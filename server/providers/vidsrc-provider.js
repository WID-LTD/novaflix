import axios from 'axios'
import { verifyHlsUrl } from './verify.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

const DOMAINS = [
  'vidsrc.to',
  'vidsrc.fyi',
  'vidsrc.su',
  'vidsrc.cc',
  'vidsrc.sbs',
  'vidsrc.me',
]

export default {
  name: 'vidsrc-multi',
  priority: 3,

  async resolve(tmdbId, type, season, episode) {
    const errors = []
    for (const domain of DOMAINS) {
      try {
        const result = await tryDomain(domain, tmdbId, type, season, episode)
        if (result) return result
      } catch (e) {
        errors.push(`${domain}: ${e.message?.slice(0, 60)}`)
      }
    }
    throw new Error('vidsrc-multi: ' + errors.join('; '))
  },
}

async function tryDomain(domain, tmdbId, type, season, episode) {
  const embedUrl = season
    ? `https://${domain}/embed/tv/${tmdbId}/${season}/${episode}`
    : `https://${domain}/embed/movie/${tmdbId}`

  const res = await axios.get(embedUrl, {
    headers: { 'User-Agent': UA, Referer: `https://${domain}/` },
    timeout: 6000,
  })
  const html = res.data

  if (html.includes('cf-browser-verification') || html.includes('__cf_chl')) {
    throw new Error('cloudflare')
  }

  const iframes = [...html.matchAll(/<iframe[^>]*src="([^"]+)/gi)].map(m => m[1])
  const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)/gi)].map(m => m[1])

  for (const src of [...iframes, ...scripts]) {
    const fullUrl = src.startsWith('http') ? src : new URL(src, embedUrl).href
    try {
      const fr = await axios.get(fullUrl, {
        headers: { 'User-Agent': UA, Referer: embedUrl },
        timeout: 5000,
      })
      const fhtml = fr.data

      const m3u8s = extractM3U8(typeof fhtml === 'string' ? fhtml : JSON.stringify(fhtml))
      for (const m3u8 of m3u8s) {
        const ok = await verifyHlsUrl(m3u8, embedUrl)
        if (ok) return { streamUrl: m3u8, subtitles: [] }
      }
    } catch {}
  }

  const m3u8s = extractM3U8(html)
  for (const m3u8 of m3u8s) {
    const ok = await verifyHlsUrl(m3u8, embedUrl)
    if (ok) return { streamUrl: m3u8, subtitles: [] }
  }

  throw new Error('no stream found')
}

function extractM3U8(text) {
  if (!text || typeof text !== 'string') return []
  const results = new Set()

  const patterns = [
    /https?:\/\/[^"'<\s]+\.m3u8[^"'<\s]*/gi,
    /<source[^>]*src="([^"]+\.m3u8[^"]*)/gi,
    /"file"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
    /'file'\s*:\s*'([^']+\.m3u8[^']*)'/gi,
    /data-hls\s*=\s*"([^"]+)"/gi,
    /"hls"\s*:\s*"([^"]+)"/gi,
    /"url"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
    /"playUrl"\s*:\s*"([^"]+)"/gi,
    /"stream"\s*:\s*"([^"]+)"/gi,
    /"playlist_url"\s*:\s*"([^"]+)"/gi,
  ]

  for (const p of patterns) {
    for (const m of text.matchAll(p)) {
      const url = m[1] || m[0]
      if (url.startsWith('http') && !url.includes('favicon')) results.add(decodeURIComponent(url))
    }
  }

  return [...results]
}
