import { useState, useEffect } from 'react'
import { getTrendingFeed, getNowPlaying, getDetails } from '../lib/api'
import { useStore } from '../store/useStore'
import HeroBanner from '../components/features/HeroBanner'
import ContentRow from '../components/features/ContentRow'
import type { MediaItem, MediaDetails } from '../types'

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const HERO_COUNT = 6

export default function Home() {
  const [heroItems, setHeroItems] = useState<MediaDetails[]>([])
  const continueWatching = useStore((s) => s.continueWatching)
  const watchlist = useStore((s) => s.watchlist)
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([])
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>([])
  const [nowPlaying, setNowPlaying] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [trendingRes, nowPlayingRes] = await Promise.all([
        getTrendingFeed(),
        getNowPlaying(),
      ])

      const movies = trendingRes.success ? trendingRes.data.movies.slice(0, 20) : []
      const tv = trendingRes.success ? trendingRes.data.tv.slice(0, 20) : []
      const np = nowPlayingRes.success ? nowPlayingRes.data.slice(0, 20) : []

      setTrendingMovies(movies)
      setTrendingTV(tv)
      setNowPlaying(np)

      const heroCandidates = shuffleArray([...np.slice(0, 8), ...movies.slice(0, 8)]).slice(0, HERO_COUNT)

      if (heroCandidates.length > 0) {
        const detailResults = await Promise.all(
          heroCandidates.map((item) => getDetails(String(item.id), item.type))
        )
        setHeroItems(
          detailResults
            .filter((r) => r.success && r.data)
            .map((r) => r.data)
            .slice(0, HERO_COUNT)
        )
      }

      setLoading(false)
    }
    load()
  }, [])

  const continueWatchingItems: MediaItem[] = continueWatching.map((cw) => ({
    id: cw.id,
    title: cw.title,
    poster: cw.poster,
    backdrop: null,
    type: cw.type,
    year: '',
    overview: '',
  }))

  return (
    <div className="min-h-screen">
      <HeroBanner items={heroItems} loading={loading} />

      <main className="relative z-20 -mt-20 space-y-16 pb-nav">
        {continueWatchingItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueWatchingItems}
            link="/watchlist"
          />
        )}

        {trendingMovies.length > 0 && (
          <ContentRow
            title="Trending Now"
            items={trendingMovies.slice(0, 20)}
            link="/discover?sort=trending"
          />
        )}

        {watchlist.length > 0 && (
          <ContentRow
            title="Because You Watched"
            items={shuffleArray([...trendingMovies, ...trendingTV]).slice(0, 10)}
            link="/discover"
          />
        )}

        {nowPlaying.length > 0 && (
          <ContentRow
            title="Now Playing"
            items={nowPlaying}
            link="/search?type=movie"
          />
        )}

        {trendingTV.length > 0 && (
          <ContentRow
            title="Popular TV Shows"
            items={trendingTV}
            link="/tv-shows"
          />
        )}

        {trendingMovies.length > 0 && (
          <ContentRow
            title="Top Rated Movies"
            items={shuffleArray(trendingMovies).slice(0, 20)}
            link="/discover?sort=top_rated"
          />
        )}
      </main>
    </div>
  )
}
