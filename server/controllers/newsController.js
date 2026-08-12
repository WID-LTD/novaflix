import axios from 'axios'
import * as cheerio from 'cheerio'

const CACHE_TTL = 60 * 1000
const cache = new Map()
const articleCache = new Map()
const articleContentCache = new Map()

function cached(key, ttl = CACHE_TTL) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttl) return hit.value
  return null
}

function setCache(key, value) {
  cache.set(key, { value, at: Date.now() })
}

function indexArticles(list) {
  for (const a of list || []) {
    if (a && a.url && a.url !== '#') {
      articleCache.set(a.url, { ...a, at: Date.now() })
    }
  }
}

const normalize = {
  newsapi(article) {
    return {
      id: article.url || `newsapi-${article.publishedAt}-${Math.random().toString(36).slice(2, 8)}`,
      title: article.title || 'Untitled',
      description: article.description || article.content || '',
      content: article.content || null,
      url: article.url || '#',
      image: article.urlToImage || null,
      source: article.source?.name || 'NewsAPI',
      publishedAt: article.publishedAt || null,
      category: 'general',
      provider: 'NewsAPI',
    }
  },
  newsdata(article) {
    return {
      id: article.link || `newsdata-${article.pubDate}-${Math.random().toString(36).slice(2, 8)}`,
      title: article.title || 'Untitled',
      description: article.description || '',
      content: article.content || article.description || null,
      url: article.link || '#',
      image: article.image_url || null,
      source: article.source_name || article.source_id || 'NewsData',
      publishedAt: article.pubDate || null,
      category: article.category?.[0] || 'general',
      provider: 'NewsData.io',
    }
  },
  apitube(article) {
    return {
      id: article.id || article.url || `apitube-${Math.random().toString(36).slice(2, 8)}`,
      title: article.title || 'Untitled',
      description: article.description || article.content || '',
      content: article.content || article.description || null,
      url: article.url || '#',
      image: article.image || article.image_url || null,
      source: article.source?.name || article.source_name || 'APITube',
      publishedAt: article.published_at || article.publishedAt || null,
      category: article.category || 'general',
      provider: 'APITube',
    }
  },
}

async function fetchAPITube({ category, q, industry }) {
  const key = process.env.APITUBE_KEY
  if (!key) return []
  const params = { api_key: key, language: 'en', limit: 40 }
  if (q) params.title = q
  if (category && category !== 'general' && !industry) params.category = category
  if (industry) params.industry = industry
  const url = industry
    ? 'https://api.apitube.io/v1/news/everything'
    : 'https://api.apitube.io/v1/news/top-headlines'
  const res = await axios.get(url, { params, timeout: 8000 })
  const list = res.data?.data || res.data?.articles || []
  return list.map(normalize.apitube).filter((a) => a.title)
}

async function fetchNewsData({ category, q }) {
  const key = process.env.NEWSDATA_KEY
  if (!key) return []
  const params = { apikey: key, language: 'en', size: 10, country: 'us' }
  if (category && category !== 'general') params.category = category
  if (q) params.q = q
  const res = await axios.get('https://newsdata.io/api/1/news', { params, timeout: 8000 })
  const list = res.data?.results || []
  return list.map(normalize.newsdata).filter((a) => a.title)
}

async function fetchNewsAPI({ category, q, qInTitle, sortBy = 'publishedAt' }) {
  const key = process.env.NEWSAPI_KEY
  if (!key) return []
  const params = {
    apiKey: key,
    q: q || (category && category !== 'general' ? category : 'entertainment'),
    language: 'en',
    pageSize: 30,
    sortBy,
  }
  if (qInTitle) params.qInTitle = qInTitle
  const res = await axios.get('https://newsapi.org/v2/everything', { params, timeout: 8000 })
  const list = res.data?.articles || []
  return list.map(normalize.newsapi).filter((a) => a.title)
}

function dedupe(articles) {
  const seen = new Set()
  const out = []
  for (const a of articles) {
    const key = a.url || a.title
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  return out
}

function sortByDate(articles) {
  return articles.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return tb - ta
  })
}

const MOVIE_RE = /\b(film|movie|movies|cinema|cinematic|screen|director|actor|actress|filmmaker|studio|box\s?office|trailer|premiere|premi[èe]re|streaming|oscar|blockbuster|hollywood|bollywood|nollywood|documentary|horror|thriller|sequel|remake|teaser|cinematograph|red carpet)\b/i
const NON_MOVIE_RE = /\b(music|album|singer|song|concert|gig|band|rapper|nft|crypto|bitcoin|soccer|football|basketball|tennis|nfl|nba|nhl|election|president|politics|war|weather|pandemic|virus|covid|stock|economy|inflation|gaming|esports|video game|k-pop|hip-hop|fashion|fitness|recipe|food)\b/i

function isMovieRelevant(article) {
  const text = `${article.title || ''} ${article.description || ''}`
  if (NON_MOVIE_RE.test(text)) return false
  return MOVIE_RE.test(text)
}

function applyMovieFilter(articles) {
  return articles.filter(isMovieRelevant)
}

const MOVIE_Q_OR = 'film OR cinema OR streaming OR box office OR movie OR trailer OR premiere'

export async function getNews(req, res) {
  try {
    const category = 'movies'
    const userQ = (req.query.q || '').trim()
    const q = userQ ? `${userQ} movie` : 'film movie cinema'
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(40, Math.max(1, parseInt(req.query.limit, 10) || 12))
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true'
    const cacheKey = `news:movies:${userQ}`
    const cachedList = refresh ? null : cached(cacheKey)

    if (cachedList) {
      const total = cachedList.length
      const offset = (page - 1) * limit
      const pageArticles = cachedList.slice(offset, offset + limit)
      const nextPage = offset + limit < total ? page + 1 : null
      return res.json({ success: true, category, total, page, limit, nextPage, articles: pageArticles })
    }

    let articles = []
    const errors = []

    // Provider chain: NewsData.io -> NewsAPI -> APITube
    try {
      const r = await fetchNewsData({ category: 'entertainment', q })
      if (r.length) articles = r
    } catch (e) { errors.push(`NewsData: ${e.message || e.code}`) }

    if (articles.length === 0) {
      try {
        const r = await fetchNewsAPI({ category: 'entertainment', q: userQ ? `${userQ} AND (movie OR film OR cinema OR trailer)` : MOVIE_Q_OR })
        if (r.length) articles = r
      } catch (e) { errors.push(`NewsAPI: ${e.message || e.code}`) }
    }

    if (articles.length === 0) {
      try {
        const r = await fetchAPITube({ category: 'entertainment', q })
        if (r.length) articles = r
      } catch (e) { errors.push(`APITube: ${e.message || e.code}`) }
    }

    const all = dedupe(sortByDate(applyMovieFilter(articles)))
    const total = all.length
    const offset = (page - 1) * limit
    const pageArticles = all.slice(offset, offset + limit)
    const nextPage = offset + limit < total ? page + 1 : null
    const result = { success: true, category, total, page, limit, nextPage, articles: pageArticles, errors }
    setCache(cacheKey, all)
    indexArticles(all)
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function getHomeNews(req, res) {
  try {
    const cacheKey = 'news:home'
    const cachedRes = cached(cacheKey)
    if (cachedRes) return res.json(cachedRes)

    let articles = []
    const errors = []

    try {
      const r = await fetchNewsData({ category: 'entertainment', q: 'film movie cinema' })
      if (r.length) articles = r
    } catch (e) { errors.push(`NewsData: ${e.message || e.code}`) }

    if (articles.length === 0) {
      try {
        const r = await fetchAPITube({ industry: 'entertainment', q: 'film movie cinema' })
        if (r.length) articles = r
      } catch (e) { errors.push(`APITube: ${e.message || e.code}`) }
    }

    if (articles.length === 0) {
      try {
        const r = await fetchNewsAPI({ category: 'entertainment', q: MOVIE_Q_OR })
        if (r.length) articles = r
      } catch (e) { errors.push(`NewsAPI: ${e.message || e.code}`) }
    }

    const result = { success: true, articles: dedupe(sortByDate(applyMovieFilter(articles))).slice(0, 8), errors }
    setCache(cacheKey, result)
    const fresh = dedupe(sortByDate(applyMovieFilter(articles)))
    indexArticles(fresh)
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function getIndustryWatch(req, res) {
  try {
    const cacheKey = 'news:industry-watch'
    const cachedRes = cached(cacheKey)
    if (cachedRes) return res.json(cachedRes)

    let articles = []
    let errors = []
    try {
      const r = await fetchAPITube({ industry: 'entertainment', q: 'film movie cinema box office' })
      if (r.length) articles = r
    } catch (e) { errors.push(e.message || e.code) }

    if (articles.length === 0) {
      try {
        const r = await fetchNewsData({ category: 'entertainment', q: 'film movie cinema' })
        if (r.length) articles = r
      } catch (e) { errors.push(e.message || e.code) }
    }

    if (articles.length === 0) {
      try {
        const r = await fetchNewsAPI({ category: 'entertainment', q: 'film OR cinema OR streaming OR box office' })
        if (r.length) articles = r
      } catch (e) { errors.push(e.message || e.code) }
    }

    const result = { success: true, articles: dedupe(sortByDate(applyMovieFilter(articles))), errors }
    setCache(cacheKey, result)
    indexArticles(result.articles)
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

function cleanTokens(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

function titleSimilarity(a, b) {
  const ta = new Set(cleanTokens(a))
  const tb = new Set(cleanTokens(b))
  if (!ta.size || !tb.size) return 0
  let overlap = 0
  for (const w of ta) if (tb.has(w)) overlap++
  return overlap / Math.min(ta.size, tb.size)
}

function stripTags(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export async function fetchDeepDive(req, res) {
  try {
    const title = (req.query.title || '').trim().slice(0, 300)
    const keywords = (req.query.keywords || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8)
    if (!title) return res.status(400).json({ success: false, error: 'title required' })

    const cacheKey = `deepdive:${title}`
    const cachedResult = cached(cacheKey, 2 * CACHE_TTL)
    if (cachedResult) return res.json(cachedResult)

    const query = (title + ' ' + keywords.join(' ')).replace(/["'`]/g, '').slice(0, 200)

    // Fire all three providers concurrently; isolate failures with allSettled.
    const settled = await Promise.allSettled([
      fetchNewsAPI({ category: 'entertainment', q: keywords.join(' ') || undefined, qInTitle: title.slice(0, 80), sortBy: 'relevancy' }),
      fetchNewsData({ category: 'entertainment', q: query }),
      fetchAPITube({ category: 'entertainment', q: query }),
    ])

    const errors = []
    const collect = (result, label) => {
      if (result.status === 'fulfilled') return result.value || []
      const msg = result.reason?.message || String(result.reason || 'request failed')
      errors.push(`${label}: ${msg}`)
      console.error(`[news] ${label} failed for deep-dive:`, msg)
      return []
    }

    const pooled = dedupe(
      sortByDate(
        collect(settled[0], 'NewsAPI').concat(collect(settled[1], 'NewsData')).concat(collect(settled[2], 'APITube'))
      )
    )

    // De-duplicate by normalized URL and near-identical titles.
    const articles = []
    const seenUrls = new Set()
    const seenTitles = []
    for (const a of pooled) {
      const u = (a.url || '').split('#')[0].split('?')[0].replace(/\/$/, '').toLowerCase()
      if (!u || seenUrls.has(u)) continue
      seenUrls.add(u)
      if (seenTitles.some((t) => titleSimilarity(t, a.title) >= 0.85)) continue
      seenTitles.push(a.title)
      articles.push(a)
    }

    // Rank candidates against the clicked headline.
    const lowered = title.toLowerCase()
    const scored = articles
      .map((a) => ({ a, score: titleSimilarity(a.title, title) + (a.title.toLowerCase().includes(lowered) ? 0.3 : 0) }))
      .sort((x, y) => y.score - x.score)
    const best = scored.find((s) => s.score >= 0.35)?.a || scored[0]?.a || null

    const headline = best
      ? {
          title: best.title,
          url: best.url,
          body: stripTags(best.content || best.description || ''),
          image: best.image || null,
          source: best.source,
          provider: best.provider,
          publishedAt: best.publishedAt,
        }
      : null

    // Varied images across providers.
    const seenImages = new Set()
    const images = []
    for (const a of articles) {
      const img = a.image
      if (!img || seenImages.has(img)) continue
      seenImages.add(img)
      images.push({ url: img, alt: a.title, source: a.source })
    }

    // Related background articles (everything except the headline).
    const related = articles
      .filter((a) => !headline || a.url !== headline.url)
      .map((a) => ({
        title: a.title,
        url: a.url,
        source: a.source,
        provider: a.provider,
        publishedAt: a.publishedAt,
        snippet: stripTags(a.description || '').slice(0, 220),
      }))

    // Publisher metadata.
    const seenSources = new Set()
    const publishers = []
    for (const a of articles) {
      const name = a.source
      if (!name || seenSources.has(name)) continue
      seenSources.add(name)
      publishers.push({ name, domain: hostnameOf(a.url), provider: a.provider })
    }

    const timeline = articles
      .filter((a) => a.publishedAt)
      .map((a) => ({ title: a.title, url: a.url, source: a.source, publishedAt: a.publishedAt }))

    const providersTried = ['NewsAPI', 'NewsData.io', 'APITube']
    const providersOk = providersTried.filter((_, i) => settled[i].status === 'fulfilled')

    const result = {
      success: true,
      query: { title, keywords },
      headline,
      images: images.slice(0, 12),
      related: related.slice(0, 12),
      publishers: publishers.slice(0, 12),
      timeline: timeline.slice(0, 20),
      meta: { synthesizedAt: new Date().toISOString(), errorCount: errors.length, errors, providersTried, providersOk },
    }
    setCache(cacheKey, result)
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function getArticle(req, res) {
  try {
    const url = (req.query.url || '').trim()
    if (!url) return res.status(400).json({ success: false, error: 'URL required' })
    const article = articleCache.get(url)
    if (!article) return res.json({ success: false, error: 'Article not found' })
    const { at, ...payload } = article
    res.json({ success: true, article: payload })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

const ARTICLE_CONTENT_TTL = 10 * 60 * 1000

const BODY_SELECTOR = [
  '[itemprop="articleBody"]',
  '.article-content', '.post-content', '.article-body', '.post-body', '.entry-content', '.story-body', '.main-content',
  '.article__content', '.post__content', '.story-content', '.td-post-content', '.c-entry-content', '.article-text',
  '[class*="article-body"]', '[class*="post-content"]', '[class*="entry-content"]', '[class*="story-content"]',
  '[class*="article__content"]', '[class*="article-content"]',
  'article', 'main',
]

function collectJsonLdBodies(node, out) {
  if (!node || typeof node !== 'object') return
  if (typeof node.articleBody === 'string') out.push(node.articleBody)
  if (Array.isArray(node['@graph'])) for (const n of node['@graph']) collectJsonLdBodies(n, out)
  if (Array.isArray(node.itemListElement)) for (const n of node.itemListElement) collectJsonLdBodies(n, out)
}

function jsonLdArticleBody($) {
  let body = ''
  $('script[type="application/ld+json"]').each((_, el) => {
    if (body) return
    const raw = $(el).html() || ''
    try {
      const parsed = JSON.parse(raw)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        const found = []
        collectJsonLdBodies(item, found)
        const candidate = found.map((b) => stripTags(b)).find((b) => b.length > 200)
        if (candidate) {
          body = candidate
          break
        }
      }
    } catch { /* ignore malformed JSON-LD */ }
  })
  return body
}

function paragraphsFromText(text) {
  const blocks = (text || '')
    .split(/\n+/)
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter((b) => b.length > 0)
  if (blocks.length === 0) return []
  if (blocks.length > 1) return blocks.filter((b) => b.length > 60)
  const sentences = blocks[0].match(/[^.!?]+[.!?]+/g) || []
  if (sentences.length > 1) {
    const chunks = []
    let current = ''
    for (const s of sentences) {
      const next = (current ? current + ' ' : '') + s
      if (current && next.length > 420) {
        chunks.push(current)
        current = s
      } else {
        current = next
      }
    }
    if (current.trim().length > 60) chunks.push(current.trim())
    return chunks
  }
  return blocks[0].length > 60 ? [blocks[0]] : []
}

function metaContent($, name) {
  const v =
    $(`meta[property="${name}"]`).attr('content') ||
    $(`meta[name="${name}"]`).attr('content') ||
    $(`meta[itemprop="${name}"]`).attr('content') ||
    ''
  return v ? v.trim() : ''
}

function hostnameOfUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function resolveUrl(url, maybeRelative) {
  try {
    const absolute = new URL(maybeRelative, url)
    return absolute.href
  } catch {
    return maybeRelative
  }
}

function extractArticleBody($, url) {
  let $root = null
  for (const sel of BODY_SELECTOR) {
    const $el = $(sel).first()
    if ($el.length && ($el.find('p').length >= 2 || $el.text().trim().length > 300)) {
      $root = $el
      break
    }
  }
  if (!$root && $('p').length > 0) {
    const $parent = $('article p').first().parents('article')
    $root = $parent.length ? $parent.first() : $('body')
  }
  if (!$root) return { paragraphs: [], images: [] }

  const $clone = $root.clone()
  $clone.find('script, style, nav, aside, footer, header, figure, form, iframe, noscript, .ad, .ads, .advertisement, .share, .related, .subscribe, .newsletter, button').remove()
  const $imgs = $clone.find('img').slice(0, 8)
  const images = []
  $imgs.each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || ''
    const srcset = $(el).attr('srcset') || ''
    let best = src
    if (srcset) {
      best = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).pop() || src
    }
    if (best) images.push(resolveUrl(url, best))
  })

  const paragraphs = []
  $clone.find('p').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text.length > 40) paragraphs.push(text)
  })

  if (paragraphs.length === 0) {
    const text = $clone.text().replace(/\s+/g, ' ').trim()
    if (text.length > 60) paragraphs.push(text)
  }

  return { paragraphs: paragraphs.map((p) => p.slice(0, 3000)).slice(0, 60), images }
}

function filterParagraphs(list) {
  const out = []
  const seen = new Set()
  for (const p of list) {
    const text = p.replace(/\s+/g, ' ').trim()
    if (text.length < 60 || seen.has(text)) continue
    seen.add(text)
    out.push(text.slice(0, 3000))
    if (out.length >= 60) break
  }
  return out
}

export async function getArticleContent(req, res) {
  const url = (req.query.url || '').trim()
  try {
    if (!url) return res.status(400).json({ success: false, error: 'URL required' })
    let parsed
    try {
      parsed = new URL(url)
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol')
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL' })
    }

    const cachedHit = articleContentCache.get(url)
    if (cachedHit && Date.now() - cachedHit.at < ARTICLE_CONTENT_TTL) {
      return res.json({ success: true, article: cachedHit.article, cached: true })
    }

    const fetchRes = await axios.get(url, {
      timeout: 12000,
      maxRedirects: 5,
      responseType: 'text',
      transformResponse: (d) => d,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    const html = typeof fetchRes.data === 'string' ? fetchRes.data : String(fetchRes.data)

    const $ = cheerio.load(html)
    const title =
      metaContent($, 'og:title') ||
      metaContent($, 'twitter:title') ||
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      ''
    const image =
      metaContent($, 'og:image') ||
      metaContent($, 'twitter:image') ||
      $('article img').first().attr('src') ||
      $('img').first().attr('src') ||
      null
    const source =
      metaContent($, 'og:site_name') ||
      metaContent($, 'application-name') ||
      hostnameOfUrl(url) ||
      null
    const publishedAt =
      metaContent($, 'article:published_time') ||
      metaContent($, 'og:pubdate') ||
      $('time[datetime]').first().attr('datetime') ||
      null

    const { paragraphs, images } = extractArticleBody($, url)

    let bodyFrom = 'html'
    let finalParagraphs = paragraphs
    if (finalParagraphs.length === 0) {
      const jsonLd = jsonLdArticleBody($)
      const jsonLdParas = jsonLd ? paragraphsFromText(jsonLd) : []
      if (jsonLdParas.length >= 2) {
        finalParagraphs = jsonLdParas
        bodyFrom = 'jsonld'
      }
    }
    if (finalParagraphs.length === 0) {
      const desc = metaContent($, 'og:description') || metaContent($, 'description')
      if (desc && desc.length > 120) {
        finalParagraphs = [desc]
        bodyFrom = 'meta'
      }
    }

    if (!title && finalParagraphs.length === 0) {
      return res.json({ success: false, error: 'Could not read this article from the source.' })
    }

    const article = {
      url,
      title,
      image: image ? resolveUrl(url, image) : null,
      images,
      source,
      publishedAt,
      paragraphs: filterParagraphs(finalParagraphs),
      bodyFrom,
    }
    articleContentCache.set(url, { article, at: Date.now() })
    res.json({ success: true, article, cached: false })
  } catch (err) {
    const isAuth = err?.response?.status === 403 || err?.response?.status === 401
    const code = err?.response?.status || ''
    res.json({
      success: false,
      error: isAuth
        ? `The source (${code}) requires a subscription or blocks automated readers.`
        : `Couldn't reach the article at this source${code ? ` (${code})` : ''}.`,
    })
  }
}
