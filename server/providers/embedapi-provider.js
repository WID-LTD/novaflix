import axios from 'axios'
import { verifyHlsUrl } from './verify.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

export default {
  name: 'embed-api',
  priority: 5,

  async resolve(tmdbId, type, season, episode) {
    const url = season
      ? `https://player.embed-api.stream/?id=${tmdbId}&s=${season}&e=${episode}`
      : `https://player.embed-api.stream/?id=${tmdbId}`

    const res = await axios.get(url, {
      headers: { 'User-Agent': UA, Referer: 'https://player.embed-api.stream/' },
      timeout: 8000,
    })
    const html = res.data

    const atobCalls = html.match(/atob\("[^"]+"\)/g) || []
    for (const call of atobCalls) {
      const m = call.match(/atob\("([^"]+)"\)/)
      if (!m) continue
      try {
        const decoded = Buffer.from(m[1], 'base64').toString('utf8')
        if (decoded.includes('http') && !decoded.includes('.js') && !decoded.includes('.css')) {
          const hlsMatch = decoded.match(/https?:\/\/[^"'<\s]+\.(?:m3u8|mp4)[^"'<\s]*/i)
          if (hlsMatch) {
            const ok = await verifyHlsUrl(hlsMatch[0], 'https://player.embed-api.stream/')
            if (ok) return { streamUrl: hlsMatch[0], subtitles: [] }
          }
        }
      } catch {}
    }

    const iframes = [...html.matchAll(/<iframe[^>]*src="([^"]+)/gi)].map(m => m[1])
    for (const iframe of iframes) {
      const fullUrl = iframe.startsWith('http') ? iframe : `https://player.embed-api.stream/${iframe}`
      try {
        const fr = await axios.get(fullUrl, {
          headers: { 'User-Agent': UA, Referer: url },
          timeout: 6000,
        })
        const body = typeof fr.data === 'string' ? fr.data : JSON.stringify(fr.data)
        const m3u8s = extractM3U8(body)
        for (const m3u8 of m3u8s) {
          const ok = await verifyHlsUrl(m3u8, fullUrl)
          if (ok) return { streamUrl: m3u8, subtitles: [] }
        }
      } catch {}
    }

    const evalCalls = html.match(/(?:eval|function)\s*\([^)]*\)\s*\{[^}]*https?:\/\/[^}]+\.m3u8[^}]*\}/gi) || []
    for (const evalCall of evalCalls) {
      const m3u8Match = evalCall.match(/https?:\/\/[^"'<\s]+\.m3u8[^"'<\s]*/i)
      if (m3u8Match) {
        const ok = await verifyHlsUrl(m3u8Match[0], 'https://player.embed-api.stream/')
        if (ok) return { streamUrl: m3u8Match[0], subtitles: [] }
      }
    }

    const m3u8s = extractM3U8(html)
    for (const m3u8 of m3u8s) {
      const ok = await verifyHlsUrl(m3u8, 'https://player.embed-api.stream/')
      if (ok) return { streamUrl: m3u8, subtitles: [] }
    }

    throw new Error('embed-api: no stream found')
  },
}

function extractM3U8(text) {
  if (!text || typeof text !== 'string') return []
  const results = new Set()
  const patterns = [
    /https?:\/\/[^"'<\s]+\.m3u8[^"'<\s]*/gi,
    /<source[^>]*src="([^"]+\.m3u8[^"]*)/gi,
    /"file"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
    /"url"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
    /"hls"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
    /"stream"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
  ]
  for (const p of patterns) {
    for (const m of text.matchAll(p)) {
      const url = m[1] || m[0]
      if (url.startsWith('http') && !url.includes('favicon')) results.add(url)
    }
  }
  return [...results]
}
