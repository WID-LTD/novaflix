import axios from 'axios'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
const XPLAY_HOST = 'https://play.xpass.top'

export default {
  name: 'xpass',
  priority: 2,

  async resolve(tmdbId, type, season, episode) {
    const pageUrl = season
      ? `${XPLAY_HOST}/e/tv/${tmdbId}/${season}/${episode}?autostart=true`
      : `${XPLAY_HOST}/e/movie/${tmdbId}?autostart=true`

    const res = await axios.get(pageUrl, {
      headers: { 'User-Agent': UA, Referer: 'https://www.2embed.skin/' },
      timeout: 8000,
    })
    const html = res.data

    const suburl = extractSuburl(html)
    const playlistPaths = extractPlaylistPaths(html)

    const limitedPaths = playlistPaths.slice(0, 5)
    for (const path of limitedPaths) {
      try {
        const plUrl = `${XPLAY_HOST}${path}`
        const plRes = await axios.get(plUrl, {
          headers: { 'User-Agent': UA, Referer: `${XPLAY_HOST}/` },
          timeout: 5000,
        })
        const plData = plRes.data
        const sources = plData?.playlist?.[0]?.sources || []
        for (const source of sources) {
          if (source.file && source.type === 'hls' && source.file.startsWith('http')) {
            const tracks = plData?.playlist?.[0]?.tracks || []
            let subtitles = tracks
              .filter(t => t.kind === 'captions' || t.kind === 'subtitles')
              .map(t => ({ label: t.label || 'Unknown', file: resolveUrl(t.file, XPLAY_HOST) }))
            if (subtitles.length === 0 && suburl) {
              const apiSubs = await fetchSubtitleApi(suburl)
              if (apiSubs) subtitles = apiSubs
            }
            return { streamUrl: source.file, subtitles }
          }
        }
      } catch {}
    }

    if (suburl) {
      const apiSubs = await fetchSubtitleApi(suburl)
      if (apiSubs && apiSubs.length > 0) {
        return { embedUrl: pageUrl, subtitles: apiSubs }
      }
    }

    return { embedUrl: pageUrl, subtitles: [] }
  },
}

function resolveUrl(url, base) {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const baseClean = base.replace(/\/+$/, '')
  const urlClean = url.startsWith('/') ? url : '/' + url
  return baseClean + urlClean
}

function extractPlaylistPaths(html) {
  const paths = []
  const target = 'playlist.json'
  let idx = 0
  while (idx < html.length) {
    const endIdx = html.indexOf(target, idx)
    if (endIdx === -1) break
    const quoteIdx = html.lastIndexOf('"', endIdx)
    if (quoteIdx !== -1) {
      const path = html.substring(quoteIdx + 1, endIdx + target.length)
      if (path.startsWith('/') && !paths.includes(path)) paths.push(path)
    }
    idx = endIdx + 1
  }
  return paths
}

function extractSuburl(html) {
  const match = html.match(/suburl\s*=\s*"([^"]+)"/)
  return match ? match[1] : null
}

async function fetchSubtitleApi(suburl) {
  try {
    const res = await axios.get(suburl, {
      headers: { 'User-Agent': UA, Referer: 'https://play.xpass.top/' },
      timeout: 10000,
    })
    if (Array.isArray(res.data)) {
      return res.data.map(s => ({ label: s.label || s.language || 'Unknown', file: resolveUrl(s.url || s.file, XPLAY_HOST) }))
    }
  } catch {}
  return null
}
