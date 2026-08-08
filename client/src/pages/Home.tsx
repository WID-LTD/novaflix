import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getTrendingFeed, getNowPlaying, getDetails, getHomeNews, getCategoryMovies, getDiscover } from '../lib/api'
import { useStore } from '../store/useStore'
import HeroBanner from '../components/features/HeroBanner'
import ContentRow from '../components/features/ContentRow'
import NewsRow from '../components/features/NewsRow'
import HoverCard from '../components/features/HoverCard'
import Icon from '../components/ui/Icon'
import OnboardingTour from '../components/ui/OnboardingTour'
import type { MediaItem, MediaDetails } from '../types'
import type { NewsArticle } from '../lib/api'

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
  const currentProfileId = useStore((s) => s.currentProfile)
  const profiles = useStore((s) => s.profiles)
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([])
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>([])
  const [nowPlaying, setNowPlaying] = useState<MediaItem[]>([])
  const [horrorMovies, setHorrorMovies] = useState<MediaItem[]>([])
  const [indieMovies, setIndieMovies] = useState<MediaItem[]>([])
  const [anime, setAnime] = useState<MediaItem[]>([])
  const [classicMovies, setClassicMovies] = useState<MediaItem[]>([])
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [showScrollLeft, setShowScrollLeft] = useState(false)
  const [showScrollRight, setShowScrollRight] = useState(true)
  const cwScrollRef = useRef<HTMLDivElement>(null)
  const userName = profiles.find((p) => p.id === currentProfileId)?.name || 'You'

  const scrollCW = (dir: 'left' | 'right') => {
    if (!cwScrollRef.current) return
    const amount = cwScrollRef.current.clientWidth * 0.75
    cwScrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  const handleCWScroll = () => {
    if (!cwScrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = cwScrollRef.current
    setShowScrollLeft(scrollLeft > 10)
    setShowScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [trendingRes, nowPlayingRes, newsRes, horrorRes, indieRes, animeRes, classicRes] = await Promise.all([
        getTrendingFeed(),
        getNowPlaying(),
        getHomeNews(),
        getCategoryMovies('27', 'movie'),
        getDiscover({ type: 'movie', with_companies: '1549' }),
        getDiscover({ type: 'movie', genre_id: '16', with_original_language: 'ja' }),
        getDiscover({ type: 'movie', sort_by: 'vote_average.desc', min_votes: 1000, primary_release_date_lte: '1999-12-31' }),
      ])

      const movies = trendingRes.success ? trendingRes.data.movies.slice(0, 20) : []
      const tv = trendingRes.success ? trendingRes.data.tv.slice(0, 20) : []
      const np = nowPlayingRes.success ? nowPlayingRes.data.slice(0, 20) : []
      const horror = horrorRes.success ? horrorRes.data.slice(0, 20) : []
      const indie = indieRes.success ? indieRes.data.slice(0, 20) : []
      const animeList = animeRes.success ? animeRes.data.slice(0, 20) : []
      const classics = classicRes.success ? classicRes.data.slice(0, 20) : []
      if (newsRes.success) setNewsArticles(newsRes.articles || [])

      setTrendingMovies(movies)
      setTrendingTV(tv)
      setNowPlaying(np)
      setHorrorMovies(horror)
      setIndieMovies(indie)
      setAnime(animeList)
      setClassicMovies(classics)

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

    const poll = setInterval(() => {
      getHomeNews().then((res) => {
        if (res.success && res.articles) setNewsArticles((prev) => {
          const seen = new Set(prev.map((a) => a.id))
          const fresh = res.articles.filter((a) => !seen.has(a.id))
          return fresh.length ? [...fresh, ...prev].slice(0, 12) : prev
        })
      })
    }, 60000)
    return () => clearInterval(poll)
  }, [])

  return (
    <div className="min-h-screen">
      <HeroBanner items={heroItems} loading={loading} />

      <main className="relative z-20 space-y-16 pb-nav">
        {continueWatching.length > 0 && (
          <section className="relative mb-8 md:mb-10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-headline-md text-on-surface flex items-center gap-2">
                Continue Watching for {userName}
                <Icon name="chevron_right" className="text-primary" />
              </h2>
              <Link
                to="/watchlist"
                className="font-label-md text-label-md text-primary hover:underline transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="relative group">
              {showScrollLeft && (
                <button
                  onClick={() => scrollCW('left')}
                  className="absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-r from-background to-transparent flex items-center justify-start pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-label="Scroll left"
                >
                  <Icon name="chevron_left" className="text-on-surface" />
                </button>
              )}

              <div
                ref={cwScrollRef}
                onScroll={handleCWScroll}
                className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x"
              >
                {continueWatching.map((cw, i) => (
                  <HoverCard
                    key={`${cw.id}-${cw.type}`}
                    item={{
                      id: cw.id,
                      title: cw.title,
                      poster: cw.poster,
                      backdrop: null,
                      type: cw.type,
                      year: '',
                      overview: '',
                    }}
                    index={i}
                    progress={cw.progress}
                    duration={cw.duration}
                  />
                ))}
              </div>

              {showScrollRight && (
                <button
                  onClick={() => scrollCW('right')}
                  className="absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-l from-background to-transparent flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-label="Scroll right"
                >
                  <Icon name="chevron_right" className="text-on-surface" />
                </button>
              )}
            </div>
          </section>
        )}

        {trendingMovies.length > 0 && (
          <ContentRow
            title="Trending Now"
            items={trendingMovies.slice(0, 20)}
            link="/discover?sort=trending"
          />
        )}

        {newsArticles.length > 0 && (
          <NewsRow
            title="Latest Movie News"
            articles={newsArticles}
            loading={false}
            link="/news"
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

        {horrorMovies.length > 0 && (
          <ContentRow
            title="Horror Movies"
            items={horrorMovies}
            link="/discover?genre_id=27"
          />
        )}

        {indieMovies.length > 0 && (
          <ContentRow title="Indie Films" items={indieMovies} />
        )}

        {anime.length > 0 && (
          <ContentRow title="Anime" items={anime} link="/discover?genre_id=16" />
        )}

        {classicMovies.length > 0 && (
          <ContentRow title="Classic Movies" items={classicMovies} />
        )}
      </main>

      <OnboardingTour
        storageKey="novaflix-onboarding-home"
        steps={[
          {
            targetSelector: '.flex.gap-4.overflow-x-auto',
            title: 'Browse & Discover',
            description: 'Click any movie or TV show card to explore details, ratings, trailers, and similar recommendations.',
            placement: 'top',
          },
        ]}
      />
    </div>
  )
}
