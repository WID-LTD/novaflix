import type { MediaItem, MediaDetails, Episode, StreamSource, ManifestInfo, HookItem } from '../types'

const BASE = '/api'

async function fetchJson<T>(url: string, params?: Record<string, string>): Promise<T> {
  try {
    const searchParams = new URLSearchParams(params)
    const queryString = searchParams.toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    const token = localStorage.getItem('novaflix-token') || ''
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    const res = await fetch(fullUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { success: false, error: body.error || `Server error (${res.status})` } as T
    }
    return res.json()
  } catch (err) {
    return { success: false, error: 'Failed to connect to server' } as T
  }
}

export function searchMedia(query: string, type: 'movie' | 'tv'): Promise<{ success: boolean; data: MediaItem[]; error?: string }> {
  return fetchJson(`${BASE}/search`, { query, type })
}

export function getDetails(id: string, type: 'movie' | 'tv'): Promise<{ success: boolean; data: MediaDetails; error?: string }> {
  return fetchJson(`${BASE}/details`, { id, type })
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface CrewMember {
  id: number
  name: string
  job: string
  profile_path: string | null
}

export interface Credits {
  cast: CastMember[]
  crew: CrewMember[]
}

export function getCredits(id: string, type: 'movie' | 'tv'): Promise<{ success: boolean; cast: CastMember[]; crew: CrewMember[]; error?: string }> {
  return fetchJson(`${BASE}/credits`, { id, type })
}

export function getTVSeason(id: string, season: string): Promise<{ success: boolean; episodes: Episode[]; error?: string }> {
  return fetchJson(`${BASE}/tv-season`, { id, season })
}

export function getStreamSource(id: string, type: string, season?: string, episode?: string): Promise<StreamSource> {
  const params: Record<string, string> = { id, type }
  if (season) params.season = season
  if (episode) params.episode = episode
  return fetchJson(`${BASE}/source`, params)
}

export function getManifestInfo(url: string, id?: string, type?: string, season?: string, episode?: string, plan?: string): Promise<ManifestInfo> {
  const params: Record<string, string> = { url }
  if (id) params.id = id
  if (type) params.type = type
  if (season) params.season = season
  if (episode) params.episode = episode
  if (plan) params.plan = plan
  return fetchJson(`${BASE}/manifest-info`, params)
}

export function getPublicCreators(): Promise<any> {
  return fetchJson(`${BASE}/creator/public`)
}

export function getTrendingFeed(): Promise<{ success: boolean; data: { movies: MediaItem[]; tv: MediaItem[] }; error?: string }> {
  return fetchJson(`${BASE}/trending`)
}

export function searchAll(query: string): Promise<{ success: boolean; data: MediaItem[]; error?: string }> {
  return fetchJson(`${BASE}/search/all`, { q: query })
}

export function getNowPlaying(): Promise<{ success: boolean; data: MediaItem[]; error?: string }> {
  return fetchJson(`${BASE}/now-playing`)
}

export function getGenres(type?: string): Promise<{ success: boolean; data: { id: number; name: string }[]; error?: string }> {
  return fetchJson(`${BASE}/genres`, type ? { type } : {})
}

export function getCategoryMovies(genreId: string, type?: string, page?: number): Promise<{ success: boolean; data: MediaItem[]; total_pages?: number; page?: number; error?: string }> {
  const params: Record<string, string> = { id: genreId }
  if (type) params.type = type
  if (page && page > 1) params.page = String(page)
  return fetchJson(`${BASE}/category`, params)
}

// ===== ADS =====
export function getNextAd(contentId?: string): Promise<{ success: boolean; ads: AdItem[]; bingePass?: any }> {
  const token = localStorage.getItem('novaflix-token') || ''
  const params: Record<string, string> = {}
  if (contentId) params.contentId = contentId
  const searchParams = new URLSearchParams(params)
  const queryString = searchParams.toString()
  const url = queryString ? `${BASE}/ads/next?${queryString}` : `${BASE}/ads/next`
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

export function recordAdImpression(placementId: string, completed?: boolean, watchedSeconds?: number): Promise<any> {
  const token = localStorage.getItem('novaflix-token') || ''
  return fetch(`${BASE}/ads/impression`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ placementId, completed, watchedSeconds }),
  }).then(r => r.json())
}

export function grantBingePass(contentId?: string, minutes?: number): Promise<any> {
  const token = localStorage.getItem('novaflix-token') || ''
  return fetch(`${BASE}/ads/binge-pass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contentId, minutes }),
  }).then(r => r.json())
}

export function getSkipLimit(): Promise<{ success: boolean; skips_used: number; skips_max: number }> {
  const token = localStorage.getItem('novaflix-token') || ''
  return fetch(`${BASE}/ads/skip-limit`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
}

export function incrementSkip(): Promise<any> {
  const token = localStorage.getItem('novaflix-token') || ''
  return fetch(`${BASE}/ads/skip`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json())
}

export interface AdItem {
  id: string
  creative_url: string
  creative_type: 'image' | 'video'
  advertiser_name: string
  position_type: 'pause' | 'mid_roll'
  cue_time_seconds: number
  duration_seconds: number
  skip_after_seconds: number
}

export function getDiscover(params: {
  genre_id?: string
  type?: string
  sort_by?: string
  page?: number
  min_votes?: number
  with_keywords?: string
  with_companies?: string
  with_original_language?: string
  primary_release_date_gte?: string
  primary_release_date_lte?: string
}): Promise<{ success: boolean; data: MediaItem[]; total_pages?: number; page?: number; error?: string }> {
  const queryParams: Record<string, string> = {}
  if (params.genre_id) queryParams.genre_id = params.genre_id
  if (params.type) queryParams.type = params.type
  if (params.sort_by) queryParams.sort_by = params.sort_by
  if (params.page && params.page > 1) queryParams.page = String(params.page)
  if (params.min_votes) queryParams.min_votes = String(params.min_votes)
  if (params.with_keywords) queryParams.with_keywords = params.with_keywords
  if (params.with_companies) queryParams.with_companies = params.with_companies
  if (params.with_original_language) queryParams.with_original_language = params.with_original_language
  if (params.primary_release_date_gte) queryParams.primary_release_date_gte = params.primary_release_date_gte
  if (params.primary_release_date_lte) queryParams.primary_release_date_lte = params.primary_release_date_lte
  return fetchJson(`${BASE}/discover`, queryParams)
}

export function getHooksFeed(page?: number): Promise<{ success: boolean; data: HookItem[]; nextPage?: number }> {
  const params: Record<string, string> = {}
  if (page && page > 1) params.page = String(page)
  return fetchJson(`${BASE}/hooks`, params)
}

export interface NewsArticle {
  id: string
  title: string
  description: string
  content?: string | null
  url: string
  image: string | null
  source: string
  publishedAt: string | null
  category: string
  provider: string
}

export interface NewsFeed {
  success: boolean
  articles: NewsArticle[]
  errors?: string[]
  total?: number
  page?: number
  nextPage?: number | null
}

export function getNews(category = 'entertainment', q = '', page?: number, refresh?: boolean): Promise<NewsFeed> {
  const params: Record<string, string> = { category }
  if (q.trim()) params.q = q.trim()
  if (page && page > 1) params.page = String(page)
  if (refresh) params.refresh = '1'
  return fetchJson(`${BASE}/news`, params)
}

export function getHomeNews(): Promise<NewsFeed> {
  return fetchJson(`${BASE}/news/home`, {})
}

export function getIndustryNews(): Promise<NewsFeed> {
  return fetchJson(`${BASE}/news/industry`, {})
}

export function getNewsArticle(url: string): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
  return fetchJson(`${BASE}/news/article`, { url })
}

export interface DeepDiveHeadline {
  title: string
  url: string
  body: string
  image: string | null
  source: string
  provider: string
  publishedAt: string | null
}

export interface DeepDiveImage {
  url: string
  alt: string
  source: string
}

export interface DeepDiveRelated {
  title: string
  url: string
  source: string
  provider: string
  publishedAt: string | null
  snippet: string
}

export interface DeepDivePublisher {
  name: string
  domain: string | null
  provider: string
}

export interface DeepDiveTimeline {
  title: string
  url: string
  source: string
  publishedAt: string | null
}

export interface NewsDeepDive {
  success: boolean
  query: { title: string; keywords: string[] }
  headline: DeepDiveHeadline | null
  images: DeepDiveImage[]
  related: DeepDiveRelated[]
  publishers: DeepDivePublisher[]
  timeline: DeepDiveTimeline[]
  meta: { synthesizedAt: string; errorCount: number; errors: string[]; providersTried: string[]; providersOk: string[] }
  error?: string
}

export function fetchDeepDive(title: string, keywords: string[] = []): Promise<NewsDeepDive> {
  return fetchJson(`${BASE}/news/fetch-deep-dive`, { title, keywords: keywords.join(',') })
}

export interface ArticleContent {
  url: string
  title: string
  image: string | null
  images: string[]
  source: string | null
  publishedAt: string | null
  paragraphs: string[]
}

export function fetchArticleContent(url: string): Promise<{ success: boolean; article?: ArticleContent; error?: string }> {
  return fetchJson(`${BASE}/news/article-content`, { url })
}
