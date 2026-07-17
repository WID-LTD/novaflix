import type { MediaItem, MediaDetails, Episode, StreamSource, ManifestInfo, HookItem } from '../types'

const BASE = '/api'

async function fetchJson<T>(url: string, params?: Record<string, string>): Promise<T> {
  try {
    const searchParams = new URLSearchParams(params)
    const queryString = searchParams.toString()
    const fullUrl = queryString ? `${url}?${queryString}` : url
    const res = await fetch(fullUrl)
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

export function getHooksFeed(page?: number): Promise<{ success: boolean; data: HookItem[]; nextPage?: number }> {
  const params: Record<string, string> = {}
  if (page && page > 1) params.page = String(page)
  return fetchJson(`${BASE}/hooks`, params)
}
