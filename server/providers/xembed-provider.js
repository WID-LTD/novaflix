import axios from 'axios'
import { verifyHlsUrl } from './verify.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

export default {
  name: 'xembed',
  priority: 4,

  async resolve(tmdbId, type, season, episode) {
    const embedUrl = season
      ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
      : `https://www.2embed.cc/embed/${tmdbId}`

    const res = await axios.get(embedUrl, {
      headers: { 'User-Agent': UA, Referer: 'https://www.2embed.cc/' },
      timeout: 6000,
    })
    const html = res.data

    const iframes = [...html.matchAll(/<iframe[^>]*src="([^"]+)/gi)].map(m => m[1])
    const datas = [...html.matchAll(/data-(?:config|src|hls)\s*=\s*"([^"]+)/gi)].map(m => m[1])
    const imdbMatch = html.match(/tt\d+/)
    const imdbId = imdbMatch ? imdbMatch[0] : null

    const targets = [...iframes, ...datas]
    for (const target of targets) {
      const fullUrl = target.startsWith('http')
        ? target
        : (target.startsWith('/') ? `https://www.2embed.cc${target}` : `https://www.2embed.cc/${target}`)

      try {
        const tRes = await axios.get(fullUrl, {
          headers: { 'User-Agent': UA, Referer: embedUrl },
          timeout: 6000,
        })
        const body = typeof tRes.data === 'string' ? tRes.data : JSON.stringify(tRes.data)

        const m3u8s = extractM3U8(body)
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

    throw new Error('xembed: no stream found')
  },
}

function extractM3U8(text) {
  if (!text || typeof text !== 'string') return []
  const results = new Set()
  const patterns = [
    /https?:\/\/[^"'<\s]+\.m3u8[^"'<\s]*/gi,
    /<source[^>]*src="([^"]+\.m3u8[^"]*)/gi,
    /"file"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
    /"hls"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
    /"url"\s*:\s*"([^"]+\.m3u8[^"]*)"/gi,
    /"sources":\[[^\]]*"file":"([^"]+\.m3u8[^"]*)"/gi,
  ]
  for (const p of patterns) {
    for (const m of text.matchAll(p)) {
      const url = m[1] || m[0]
      if (url.startsWith('http') && !url.includes('favicon')) results.add(url)
    }
  }
  return [...results]
}
