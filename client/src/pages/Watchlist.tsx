import { useState } from 'react'
import { Bookmark, Search, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import MovieCard from '../components/features/MovieCard'
import type { MediaItem } from '../types'

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
]

export default function Watchlist() {
  const watchlist = useStore((s) => s.watchlist)
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = watchlist
    .filter((item) => filter === 'all' || item.type === filter)
    .filter((item) =>
      search ? item.title.toLowerCase().includes(search.toLowerCase()) : true
    )

  const mediaItems: MediaItem[] = filtered.map((item) => ({
    id: item.id,
    title: item.title,
    poster: item.poster,
    type: item.type,
    year: item.year,
    overview: '',
  }))

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Bookmark className="w-8 h-8 text-accent" />
          <h1 className="text-3xl md:text-section font-bold">Watchlist</h1>
          <span className="text-sm text-gray-500 mt-2">
            ({watchlist.length} items)
          </span>
        </div>

        {watchlist.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex-1 max-w-md">
                <Input
                  icon={<Search className="w-4 h-4" />}
                  placeholder="Search watchlist..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Tabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {mediaItems.map((item, i) => (
                  <div key={`${item.id}-${item.type}`} className="relative group">
                    <MovieCard item={item} index={i} />
                    <button
                      onClick={() => removeFromWatchlist(item.id)}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-400 mb-2">No items match your search</p>
                <p className="text-gray-600 text-sm">Try a different filter</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-600 mb-6">
              Add movies and TV shows to keep track of what you want to watch
            </p>
            <Button onClick={() => window.location.href = '/search'}>
              Browse Content
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
