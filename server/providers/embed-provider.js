import axios from 'axios'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

const EMBED_PROVIDERS = [
  {
    name: 'vidsrc.to',
    priority: 10,
    url: (id, type, s, e) => type === 'tv'
      ? `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
      : `https://vidsrc.to/embed/movie/${id}`,
    test: (html) => !html.includes('cf-browser-verification'),
  },
  {
    name: '2embed.cc',
    priority: 11,
    url: (id, type, s, e) => type === 'tv'
      ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
      : `https://www.2embed.cc/embed/${id}`,
    test: () => true,
  },
  {
    name: 'vidsrc.fyi',
    priority: 12,
    url: (id, type, s, e) => type === 'tv'
      ? `https://vidsrc.fyi/embed/tv/${id}/${s}/${e}`
      : `https://vidsrc.fyi/embed/movie/${id}`,
    test: (html) => !html.includes('cf-browser-verification'),
  },
  {
    name: 'vidsrc.su',
    priority: 13,
    url: (id, type, s, e) => type === 'tv'
      ? `https://vidsrc.su/embed/tv/${id}/${s}/${e}`
      : `https://vidsrc.su/embed/movie/${id}`,
    test: (html) => !html.includes('cf-browser-verification'),
  },
  {
    name: 'vidsrc.sbs',
    priority: 14,
    url: (id, type, s, e) => type === 'tv'
      ? `https://vidsrc.sbs/embed/tv/${id}/${s}/${e}`
      : `https://vidsrc.sbs/embed/movie/${id}`,
    test: (html) => !html.includes('cf-browser-verification'),
  },
  {
    name: 'vidspark.to',
    priority: 15,
    url: (id, type, s, e) => type === 'tv'
      ? `https://vidspark.to/embed/tv/${id}/${s}/${e}`
      : `https://vidspark.to/embed/movie/${id}`,
    test: () => true,
  },
  {
    name: 'moviesapi.to',
    priority: 16,
    url: (id, type, s, e) => type === 'tv'
      ? `https://moviesapi.to/embed/tv/${id}/${s}/${e}`
      : `https://moviesapi.to/embed/movie/${id}`,
    test: () => true,
  },
]

export default {
  name: 'embed-multi',
  priority: 10,

  async resolve(tmdbId, type, season, episode) {
    const errors = []

    for (const ep of EMBED_PROVIDERS) {
      try {
        const embedUrl = ep.url(tmdbId, type, season, episode)

        const res = await axios.get(embedUrl, {
          headers: { 'User-Agent': UA, Referer: `https://${new URL(embedUrl).hostname}/` },
          timeout: 5000,
          validateStatus: () => true,
        })

        if (res.status !== 200) {
          errors.push(`${ep.name}: HTTP ${res.status}`)
          continue
        }

        const html = typeof res.data === 'string' ? res.data : ''
        if (!ep.test(html)) {
          errors.push(`${ep.name}: cloudflare`)
          continue
        }

        return {
          embedUrl,
          subtitles: [],
        }
      } catch (e) {
        errors.push(`${ep.name}: ${e.message?.slice(0, 40) || e.code}`)
      }
    }

    throw new Error('embed-multi: ' + errors.join('; '))
  },
}
