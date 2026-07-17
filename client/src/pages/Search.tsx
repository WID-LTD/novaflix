import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { searchMedia } from '../lib/api'
import { useStore } from '../store/useStore'
import SearchInput from '../components/ui/SearchInput'
import Tabs from '../components/ui/Tabs'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import MovieCard from '../components/features/MovieCard'
import type { MediaItem } from '../types'

const searchTabs = [
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const typeParam = searchParams.get('type') || 'movie'
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [inputValue, setInputValue] = useState(query)
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!query)
  const addRecentSearch = useStore((s) => s.addRecentSearch)
  const recentlySearched = useStore((s) => s.recentlySearched)

  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(typeParam as 'movie' | 'tv')

  useEffect(() => {
    setMediaType(typeParam as 'movie' | 'tv')
  }, [typeParam])

  const doSearch = useCallback(async (q: string, type: 'movie' | 'tv') => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)
    addRecentSearch(q.trim())

    try {
      const res = await searchMedia(q.trim(), type)
      if (res.success) {
        setResults(res.data)
      } else {
        setResults([])
      }
    } catch {
      setResults([])
    }
    setLoading(false)
  }, [addRecentSearch])

  useEffect(() => {
    if (query) {
      doSearch(query, mediaType)
    }
  }, [query, mediaType, doSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    setQuery(inputValue.trim())
    setSearchParams({ q: inputValue.trim(), type: mediaType })
  }

  const handleTabChange = (id: string) => {
    setMediaType(id as 'movie' | 'tv')
    if (query) {
      setSearchParams({ q: query, type: id })
    } else {
      setSearchParams({ type: id })
    }
  }

  const handleRecentClick = (q: string) => {
    setInputValue(q)
    setQuery(q)
    setSearchParams({ q, type: mediaType })
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-headline-lg font-bold mb-6">Search</h1>

        <div className="mb-6">
          <SearchInput
            placeholder="Search movies, TV shows..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={handleSubmit}
            onClear={() => {
              setInputValue('')
              setQuery('')
              setResults([])
              setSearched(false)
              setSearchParams({ type: mediaType })
            }}
          />
        </div>

        <div className="mb-6">
          <Tabs tabs={searchTabs} activeTab={mediaType} onChange={handleTabChange} />
        </div>

        {!searched && recentlySearched.length > 0 && (
          <div className="mb-8">
            <h3 className="text-on-surface-variant font-label-sm mb-3">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {recentlySearched.map((s) => (
                <button
                  key={s}
                  onClick={() => handleRecentClick(s)}
                  className="px-3 py-1.5 bg-surface-container-high border border-outline/20 rounded-lg text-sm text-on-surface-variant hover:border-primary-container/50 hover:text-on-surface transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <Skeleton variant="poster" className="w-full" />
                <Skeleton variant="text" className="w-3/4 mt-2" />
                <Skeleton variant="text" className="w-1/2 mt-1" />
              </div>
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-20">
            <Icon name="search" className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-2">No results found</h3>
            <p className="text-on-surface-variant/60">Try a different search term</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-on-surface-variant text-sm">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              <Badge variant="outline">
                {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
              {results.map((item, i) => (
                <MovieCard key={`${item.id}-${item.type}`} item={item} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
