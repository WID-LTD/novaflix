import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Compass, Search, SlidersHorizontal, Grid3X3, List } from 'lucide-react'
import { searchMedia } from '../lib/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import MovieCard from '../components/features/MovieCard'
import type { MediaItem } from '../types'

const sortOptions = [
  { id: 'trending', label: 'Trending' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
]

const genreOptions = [
  { id: '', label: 'All Genres' },
  { id: 'action', label: 'Action' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'drama', label: 'Drama' },
  { id: 'horror', label: 'Horror' },
  { id: 'romance', label: 'Romance' },
  { id: 'sci-fi', label: 'Sci-Fi' },
  { id: 'thriller', label: 'Thriller' },
  { id: 'animation', label: 'Animation' },
  { id: 'documentary', label: 'Documentary' },
]

const typeTabs = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
]

const keywordMap: Record<string, string> = {
  trending: 'avengers',
  top_rated: 'inception',
  popular: 'popular',
  newest: '2024',
  action: 'mission impossible',
  comedy: 'funny',
  drama: 'drama',
  horror: 'scary',
  romance: 'romance',
  'sci-fi': 'space',
  thriller: 'thriller',
  animation: 'animated',
  documentary: 'documentary',
}

export default function Discover() {
  const [searchParams] = useSearchParams()
  const initialSort = searchParams.get('sort') || 'trending'
  const initialType = searchParams.get('type') || 'all'

  const [sort, setSort] = useState(initialSort)
  const [genre, setGenre] = useState('')
  const [type, setType] = useState<'all' | 'movie' | 'tv'>(initialType as any)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const keyword = query || keywordMap[sort] || keywordMap[genre] || 'popular'
      const searchType = type === 'all' ? null : type

      try {
        const moviePromise = searchType === null || searchType === 'movie'
          ? searchMedia(keyword, 'movie') : Promise.resolve(null)
        const tvPromise = searchType === null || searchType === 'tv'
          ? searchMedia(keyword, 'tv') : Promise.resolve(null)

        const [movieRes, tvRes] = await Promise.all([moviePromise, tvPromise])

        const items: MediaItem[] = []
        if (movieRes?.success) items.push(...movieRes.data)
        if (tvRes?.success) items.push(...tvRes.data)

        setResults(items.slice(0, 40))
      } catch {}
      setLoading(false)
    }
    load()
  }, [sort, genre, type, query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Compass className="w-8 h-8 text-accent" />
          <h1 className="text-3xl md:text-section font-bold">Discover</h1>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <Input
            icon={<Search className="w-5 h-5" />}
            placeholder="Search within discover..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Tabs tabs={typeTabs} activeTab={type} onChange={(id) => setType(id as any)} />

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-surface-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-surface-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
            >
              {genreOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <Skeleton variant="poster" className="w-full" />
                <Skeleton variant="text" className="w-3/4 mt-2" />
                <Skeleton variant="text" className="w-1/2 mt-1" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="flex items-center gap-2 mb-4">
            <p className="text-sm text-gray-400">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
          </div>
        ) : null}

        {results.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
                : 'flex flex-col gap-3'
            }
          >
            {results.map((item, i) => (
              <MovieCard key={`${item.id}-${item.type}`} item={item} index={i} />
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-20">
            <Compass className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No results</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
