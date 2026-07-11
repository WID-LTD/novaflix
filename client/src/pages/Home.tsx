import { useState, useEffect } from 'react'
import { searchMedia, getDetails } from '../lib/api'
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

async function fetchSection(keyword: string, type: 'movie' | 'tv'): Promise<MediaItem[]> {
  const res = await searchMedia(keyword, type)
  return res.success ? res.data.slice(0, 20) : []
}

export default function Home() {
  const [heroItem, setHeroItem] = useState<MediaDetails | null>(null)
  const continueWatching = useStore((s) => s.continueWatching)
  const watchlist = useStore((s) => s.watchlist)
  const [trending, setTrending] = useState<MediaItem[]>([])
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([])
  const [popularTV, setPopularTV] = useState<MediaItem[]>([])
  const [upcoming, setUpcoming] = useState<MediaItem[]>([])
  const [topRated, setTopRated] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [movieResults, tvResults, movieUpcoming, topRatedM, topRatedT] = await Promise.all([
        fetchSection('marvel', 'movie'),
        fetchSection('game of thrones', 'tv'),
        fetchSection('2024', 'movie'),
        fetchSection('inception', 'movie'),
        fetchSection('breaking bad', 'tv'),
      ])

      const allTrending = shuffleArray([
        ...movieResults.slice(0, 10),
        ...tvResults.slice(0, 10),
      ])

      setTrending(allTrending)
      setPopularMovies(movieResults)
      setPopularTV(tvResults)
      setUpcoming(movieUpcoming)
      setTopRated([...topRatedM, ...topRatedT])

      if (allTrending.length > 0) {
        const first = allTrending[0]
        const detailRes = await getDetails(String(first.id), first.type)
        if (detailRes.success) {
          setHeroItem(detailRes.data)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  const continueWatchingItems: MediaItem[] = continueWatching.map((cw) => ({
    id: cw.id,
    title: cw.title,
    poster: cw.poster,
    type: cw.type,
    year: '',
    overview: '',
  }))

  const trendingItems: MediaItem[] = trending.slice(0, 20)
  const movieItems: MediaItem[] = popularMovies.slice(0, 20)
  const tvItems: MediaItem[] = popularTV.slice(0, 20)
  const upcomingItems: MediaItem[] = upcoming.slice(0, 20)
  const topRatedItems: MediaItem[] = topRated.slice(0, 20)

  return (
    <div className="min-h-screen">
      <HeroBanner item={heroItem} loading={loading} />

      <div className="relative z-10 -mt-32 md:-mt-48">
        {continueWatchingItems.length > 0 && (
          <ContentRow
            title="Continue Watching"
            items={continueWatchingItems}
            link="/watchlist"
          />
        )}

        {trendingItems.length > 0 && (
          <ContentRow
            title="Trending Now"
            items={trendingItems}
            link="/discover?sort=trending"
          />
        )}

        {watchlist.length > 0 && (
          <ContentRow
            title="Because You Watched"
            items={shuffleArray([...movieItems, ...tvItems]).slice(0, 10)}
            link="/discover"
          />
        )}

        {movieItems.length > 0 && (
          <ContentRow
            title="Popular Movies"
            items={movieItems}
            link="/search?type=movie"
          />
        )}

        {tvItems.length > 0 && (
          <ContentRow
            title="Popular TV Shows"
            items={tvItems}
            link="/tv-shows"
          />
        )}

        {upcomingItems.length > 0 && (
          <ContentRow
            title="Trending in Your Area"
            items={upcomingItems}
            link="/discover"
          />
        )}

        {topRatedItems.length > 0 && (
          <ContentRow
            title="Top Rated"
            items={topRatedItems}
            link="/discover?sort=top_rated"
          />
        )}
      </div>
    </div>
  )
}
