import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import HoverCard from '../components/features/HoverCard'
import Skeleton from '../components/ui/Skeleton'
import { getGenres, getCategoryMovies } from '../lib/api'
import type { MediaItem } from '../types'

const genreIcons: Record<string, string> = {
  Action: 'sports_martial_arts',
  Adventure: 'explore',
  Animation: 'animation',
  Comedy: 'mood',
  Crime: 'local_police',
  Documentary: 'description',
  Drama: 'theater_comedy',
  Family: 'family_star',
  Fantasy: 'auto_stories',
  History: 'history',
  Horror: 'dangerous',
  Music: 'music_note',
  Mystery: 'search',
  Romance: 'favorite',
  'Science Fiction': 'rocket_launch',
  'Sci-Fi': 'rocket_launch',
  'TV Movie': 'live_tv',
  Thriller: 'bolt',
  War: 'shield',
  Western: 'landscape',
}

const genreColors: Record<string, string> = {
  Action: 'from-red-600/30 to-red-900/20',
  Comedy: 'from-yellow-600/30 to-yellow-900/20',
  Drama: 'from-blue-600/30 to-blue-900/20',
  Horror: 'from-purple-600/30 to-purple-900/20',
  'Science Fiction': 'from-cyan-600/30 to-cyan-900/20',
  Romance: 'from-pink-600/30 to-pink-900/20',
  Thriller: 'from-orange-600/30 to-orange-900/20',
  Documentary: 'from-green-600/30 to-green-900/20',
  Animation: 'from-indigo-600/30 to-indigo-900/20',
}

export default function CategoryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([])
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [genreName, setGenreName] = useState('')

  useEffect(() => {
    if (!slug) {
      getGenres().then((res) => {
        if (res.success) setGenres(res.data)
        setLoading(false)
      })
    } else {
      setLoading(true)
      const name = slug.replace(/-/g, ' ')
      setGenreName(name)
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (!slug) return
    const name = slug.replace(/-/g, ' ')
    setLoading(true)
    setPage(1)
    setMovies([])
    getGenres().then((genreRes) => {
      if (!genreRes.success) { setLoading(false); return }
      const found = genreRes.data.find(
        (g) => g.name.toLowerCase() === name.toLowerCase()
      )
      if (found) {
        getCategoryMovies(String(found.id), 'movie', 1).then((res) => {
          if (res.success) {
            setMovies(res.data)
            setTotalPages(res.total_pages || 1)
          }
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })
  }, [slug])

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return
    const name = slug!.replace(/-/g, ' ')
    setLoadingMore(true)
    getGenres().then((genreRes) => {
      if (!genreRes.success) { setLoadingMore(false); return }
      const found = genreRes.data.find(
        (g) => g.name.toLowerCase() === name.toLowerCase()
      )
      if (found) {
        const nextPage = page + 1
        getCategoryMovies(String(found.id), 'movie', nextPage).then((res) => {
          if (res.success) {
            setMovies((prev) => [...prev, ...res.data])
            setPage(nextPage)
          }
          setLoadingMore(false)
        })
      } else {
        setLoadingMore(false)
      }
    })
  }

  if (slug) {
    return (
      <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
        <button
          onClick={() => navigate('/category')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-6 transition-colors p-2 -ml-2"
          aria-label="Back to categories"
        >
          <Icon name="arrow_back" size="sm" /> <span className="font-label-md">Categories</span>
        </button>

        <h1 className="text-headline-lg font-bold mb-6 capitalize">{genreName}</h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-gutter">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <Skeleton variant="poster" className="w-full" />
                <Skeleton variant="text" className="w-3/4 mt-2" />
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <div className="card-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-gutter">
              {movies.map((item, i) => (
                <HoverCard key={`${item.id}-${item.type}-${i}`} item={item} index={i} className="w-full min-w-0" />
              ))}
            </div>
            {page < totalPages && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-surface-container-high hover:bg-surface-container-highest border border-white/5 rounded-xl font-label-md text-label-md transition-all disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Icon name="category" className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
            <p className="text-on-surface-variant">No movies found in this category</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="flex items-center gap-3 mb-8">
        <Icon name="category" className="w-8 h-8 text-primary-container" />
        <h1 className="text-headline-lg font-bold">Categories</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => navigate(`/category/${genre.name.toLowerCase().replace(/\s+/g, '-')}`)}
              className={`relative flex items-center gap-3 p-5 rounded-2xl border border-white/5 bg-gradient-to-br ${genreColors[genre.name] || 'from-surface-container-high to-surface-container'} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left group`}
            >
              <div className="w-10 h-10 rounded-xl bg-surface-container/80 flex items-center justify-center shrink-0 group-hover:bg-primary-container/20 transition-colors">
                <Icon
                  name={genreIcons[genre.name] || 'theater_comedy'}
                  className="text-primary-container"
                  size="sm"
                />
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface font-semibold">{genre.name}</p>
                <p className="text-xs text-on-surface-variant/60 mt-0.5">Browse {genre.name}</p>
              </div>
              <Icon name="chevron_right" size="sm" className="ml-auto text-on-surface-variant/30 group-hover:text-primary-container transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
