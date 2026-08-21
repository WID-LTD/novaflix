import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { searchMedia, getDiscover } from '../lib/api'
import Button from '../components/ui/Button'
import SearchInput from '../components/ui/SearchInput'
import Tabs from '../components/ui/Tabs'
import Skeleton from '../components/ui/Skeleton'
import HoverCard from '../components/features/HoverCard'
import type { MediaItem } from '../types'

const sortOptions = [
  { id: 'trending', label: 'Trending' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
]

const genreOptions = [
  { id: '', label: 'All Genres' },
  { id: '28', label: 'Action' },
  { id: '35', label: 'Comedy' },
  { id: '18', label: 'Drama' },
  { id: '27', label: 'Horror' },
  { id: '10749', label: 'Romance' },
  { id: '878', label: 'Sci-Fi' },
  { id: '53', label: 'Thriller' },
  { id: '16', label: 'Animation' },
  { id: '99', label: 'Documentary' },
]

const typeTabs = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
]

const sortByFor: Record<string, { movie: string; tv: string }> = {
  trending: { movie: 'popularity.desc', tv: 'popularity.desc' },
  top_rated: { movie: 'vote_average.desc', tv: 'vote_average.desc' },
  popular: { movie: 'popularity.desc', tv: 'popularity.desc' },
  newest: { movie: 'primary_release_date.desc', tv: 'first_air_date.desc' },
}

export default function Discover() {
  const [searchParams] = useSearchParams()
  const initialSort = searchParams.get('sort') || 'trending'
  const initialType = searchParams.get('type') || 'all'

  const [sort, setSort] = useState(initialSort)
  const [genre, setGenre] = useState('')
  const [type, setType] = useState<'all' | 'movie' | 'tv'>(initialType as any)
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        if (query.trim()) {
          const moviePromise = type === 'all' || type === 'movie'
            ? searchMedia(query.trim(), 'movie') : Promise.resolve(null)
          const tvPromise = type === 'all' || type === 'tv'
            ? searchMedia(query.trim(), 'tv') : Promise.resolve(null)
          const [movieRes, tvRes] = await Promise.all([moviePromise, tvPromise])
          const items: MediaItem[] = []
          if (movieRes?.success) items.push(...movieRes.data)
          if (tvRes?.success) items.push(...tvRes.data)
          setResults(items.slice(0, 40))
        } else {
          const genreId = genre || undefined
          const moviePromise = type === 'all' || type === 'movie'
            ? getDiscover({
                genre_id: genreId,
                type: 'movie',
                sort_by: sortByFor[sort]?.movie,
                min_votes: sort === 'top_rated' ? 100 : undefined,
              })
            : Promise.resolve(null)
          const tvPromise = type === 'all' || type === 'tv'
            ? getDiscover({
                genre_id: genreId,
                type: 'tv',
                sort_by: sortByFor[sort]?.tv,
                min_votes: sort === 'top_rated' ? 100 : undefined,
              })
            : Promise.resolve(null)
          const [movieRes, tvRes] = await Promise.all([moviePromise, tvPromise])
          const items: MediaItem[] = []
          if (movieRes?.success) items.push(...movieRes.data)
          if (tvRes?.success) items.push(...tvRes.data)
          setResults(items.slice(0, 60))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [sort, genre, type, query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="explore" className="w-8 h-8 text-primary-container" />
          <h1 className="text-headline-lg font-bold">Discover</h1>
        </div>

        <div className="mb-6">
          <SearchInput
            placeholder="Search within discover..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSubmit={handleSearch}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Tabs tabs={typeTabs} activeTab={type} onChange={(id) => setType(id as any)} />

          <div className="flex items-center gap-2">
            <Icon name="tune" className="text-on-surface-variant" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-surface-container-high border border-outline/20 rounded-lg px-3 py-2 text-sm on-surface focus:outline-none focus:border-primary-container"
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-surface-container-high border border-outline/20 rounded-lg px-3 py-2 text-sm on-surface focus:outline-none focus:border-primary-container"
            >
              {genreOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary-container/20 text-primary-container' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-label="Grid view"
            >
              <Icon name="grid_view" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-primary-container/20 text-primary-container' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              aria-label="List view"
            >
              <Icon name="view_list" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-7">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <Skeleton variant="poster" className="w-full" />
                <Skeleton variant="text" className="w-3/4 mt-2" />
                <Skeleton variant="text" className="w-1/2 mt-1" />
              </div>
            ))}
          </div>
        ) : results.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <p className="text-on-surface-variant text-sm">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {results.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'card-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-7'
                : 'flex flex-col gap-3'
            }
          >
            {results.map((item, i) => (
              <HoverCard key={`${item.id}-${item.type}`} item={item} index={i} className="w-full min-w-0" />
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-20">
            <Icon name="explore" className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-2">No results</h3>
            <p className="text-on-surface-variant/60">Try adjusting your filters</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
