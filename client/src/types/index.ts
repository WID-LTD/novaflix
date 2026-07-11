export interface MediaItem {
  id: number
  title: string
  year: string
  poster: string | null
  overview: string
  type: 'movie' | 'tv'
}

export interface Genre {
  id: number
  name: string
}

export interface Season {
  season: number
  episodes: number
  name: string
}

export interface Episode {
  episode: number
  name: string
}

export interface MediaDetails {
  id: number
  title: string
  year: string
  releaseDate: string | null
  poster: string | null
  backdrop: string | null
  overview: string
  rating: number
  genres: string[]
  trailerKey: string | null
  type: 'movie' | 'tv'
  runtime: number | null
  seasons?: Season[]
  totalSeasons?: number
}

export interface Subtitle {
  label: string
  file: string
}

export interface StreamSource {
  success: boolean
  streamUrl: string
  directUrl: string
  subtitles: Subtitle[]
  error?: string
  releaseDate?: string | null
}

export interface Variant {
  resolution: string | null
  bandwidth: number
  url: string
  label: string
  sizeBytes: number
  sizeLabel: string
  compressedBytes: number
  compressedLabel: string
}

export interface ManifestInfo {
  success: boolean
  duration: number
  variants: Variant[]
  error?: string
}
