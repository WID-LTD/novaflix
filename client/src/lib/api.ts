import type { MediaItem, MediaDetails, Episode, StreamSource, ManifestInfo } from '../types'

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

export function getManifestInfo(url: string, id?: string, type?: string, season?: string, episode?: string): Promise<ManifestInfo> {
  const params: Record<string, string> = { url }
  if (id) params.id = id
  if (type) params.type = type
  if (season) params.season = season
  if (episode) params.episode = episode
  return fetchJson(`${BASE}/manifest-info`, params)
}

export function getPublicCreators(): Promise<any> {
  return fetchJson(`${BASE}/creator/public`)
}
