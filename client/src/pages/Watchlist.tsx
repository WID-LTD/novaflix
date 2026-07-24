import { useState } from 'react'
import Icon from '../components/ui/Icon'
import { useStore } from '../store/useStore'
import SearchInput from '../components/ui/SearchInput'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'
import HoverCard from '../components/features/HoverCard'
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
    backdrop: null,
    type: item.type,
    year: item.year,
    overview: '',
  }))

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="bookmark" className="w-8 h-8 text-primary-container" />
          <h1 className="text-headline-lg font-bold">Watchlist</h1>
          <span className="text-on-surface-variant/60 text-sm mt-2">
            ({watchlist.length} items)
          </span>
        </div>

        {watchlist.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex-1 max-w-md">
                <SearchInput
                  placeholder="Search watchlist..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Tabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-gutter">
                {mediaItems.map((item, i) => (
                  <div key={`${item.id}-${item.type}`} className="relative group">
                    <HoverCard item={item} index={i} />
                    <button
                      onClick={() => removeFromWatchlist(item.id)}
                      className="absolute top-2 right-2 p-3 rounded-lg bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-container/80"
                      aria-label="Remove from watchlist"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-on-surface-variant mb-2">No items match your search</p>
                <p className="text-on-surface-variant/60 text-sm">Try a different filter</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Icon name="bookmark" className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-2">Your watchlist is empty</h3>
            <p className="text-on-surface-variant/60 mb-6">Add movies and TV shows to keep track of what you want to watch</p>
            <Button onClick={() => window.location.href = '/search'}>Browse Content</Button>
          </div>
        )}
      </div>
    </div>
  )
}
