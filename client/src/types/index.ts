export interface MediaItem {
  id: number
  title: string
  year: string
  poster: string | null
  backdrop: string | null
  overview: string
  type: 'movie' | 'tv'
  premium?: boolean
  promoted?: boolean
  genres?: string[]
  ageRating?: string
  trailerKey?: string | null
  source?: string
  url?: string
  rating?: number
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

export interface HookItem {
  id: string
  videoUrl: string | null
  poster: string | null
  title: string
  year: string
  type: 'trailer' | 'short' | 'ad'
  promoted?: boolean
  sponsorName?: string
  mediaId?: number
  mediaType?: 'movie' | 'tv'
  shortId?: string
  creatorName?: string
  creatorId?: string
  creatorAvatar?: string | null
  views?: number
  likes?: number
  description?: string
  hashtags?: string[]
  likesCount?: number
  bookmarksCount?: number
  commentsCount?: number
  shares?: number
  liked?: boolean
  bookmarked?: boolean
  following?: boolean
}

export interface Episode {
  episode: number
  name: string
  still?: string
  overview?: string
  runtime?: number
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
  ageRating?: string
}

export interface Subtitle {
  label: string
  file: string
}

export interface EggPlacement {
  id: string
  ts_seconds: number
  pos_x: number
  pos_y: number
  radius: number
  hint: string
  reward_type: string
}

export interface StreamSource {
  success: boolean
  streamUrl: string | null
  embedUrl: string | null
  directUrl: string | null
  subtitles: Subtitle[]
  provider?: string
  providerMode?: 'hls' | 'embed'
  backups?: any[]
  fromCache?: boolean
  elapsed?: number
  attempted?: number
  totalProviders?: number
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

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string
  color?: string
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string
  category?: string
}

export interface Course {
  id: string
  title: string
  description: string
  instructor: string
  price: number
  imageUrl: string
  duration?: string
  lessons?: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: string
}

export interface UserProfile {
  id: string
  name: string
  avatar: string | null
  age?: number
  preferences?: string[]
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

export interface CreatorAnalytics {
  totalViews: number
  totalMinutes: number
  totalRevenue: number
  totalTips: number
  viewsOverTime: { date: string; views: number }[]
  revenueBreakdown: { label: string; value: number }[]
  topLocations: { country: string; percentage: number }[]
  demographics: { age: string; percentage: number }[]
}

export interface ShortVideo {
  id: string
  videoUrl: string
  thumbnailUrl: string | null
  title: string
  description?: string
  creatorName?: string
  creatorAvatar?: string | null
  audioTrackName?: string
  likesCount?: number
  commentsCount?: number
  views?: number
  liked?: boolean
}

export interface ShortComment {
  id: string
  userName: string
  userAvatar: string | null
  text: string
  createdAt: string
}
