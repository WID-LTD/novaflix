import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { searchAll } from '../lib/api'
import { API_BASE } from '../lib/config'
import { useAuth } from '../lib/AuthContext'
import HoverCard from '../components/features/HoverCard'
import RecommendationGrid from '../components/features/RecommendationGrid'
import Skeleton from '../components/ui/Skeleton'
import Tabs from '../components/ui/Tabs'
import type { MediaItem } from '../types'

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
  { id: 'creator', label: 'Creator Content' },
]

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  const typeParam = searchParams.get('type') || 'all'
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(typeParam)
  const [recs, setRecs] = useState<MediaItem[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (!query) return
    setLoading(true)
    const token = localStorage.getItem('novaflix-token') || ''

    Promise.all([
      searchAll(query),
      user
        ? fetch(`${API_BASE}/recommendations/for-you`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
        : Promise.resolve({ data: [] }),
    ]).then(([searchRes, recRes]) => {
      if (searchRes.success) setResults(searchRes.data)
      if (recRes.success) {
        const shuffled = [...(recRes.data || [])].sort(() => Math.random() - 0.5)
        setRecs(shuffled.slice(0, 8))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [query, user])

  const filtered = activeTab === 'all' ? results : results.filter(r => {
    if (activeTab === 'creator') return r.source === 'creator' || r.source === 'archive'
    return r.type === activeTab && r.source === 'tmdb'
  })

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/search" className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors">
            <Icon name="arrow_back" />
          </Link>
          <div>
            <h1 className="text-headline-md font-bold">Search Results</h1>
            <p className="text-on-surface-variant/60 text-sm mt-1">&ldquo;{query}&rdquo;</p>
          </div>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i}>
                  <Skeleton variant="poster" className="w-full" />
                  <Skeleton variant="text" className="w-3/4 mt-2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Icon name="search" className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
              <h3 className="font-label-md text-label-md text-on-surface-variant mb-2">No results found</h3>
              <p className="text-on-surface-variant/60">Try a different search term</p>
            </div>
          ) : (
            <>
              <p className="text-on-surface-variant text-sm mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {filtered.map((item, i) => {
                  if (item.source === 'creator' || item.source === 'archive') {
                    const open = () => navigate(`/watch?id=${item.id}&type=movie`)
                    return (
                      <div key={`${item.source}-${item.id}`} onClick={open} role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') open() }}
                        className="min-w-0 bg-surface-container-high rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-primary-container/40 transition-colors">
                        <div className="aspect-[2/3] bg-surface-container relative">
                          {item.poster ? (
                            <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-on-surface-variant/40">
                              <Icon name="movie" className="w-10 h-10" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded-full bg-primary-container/80 text-on-primary-container text-[10px] font-bold uppercase tracking-wider">
                              {item.source === 'creator' ? 'Creator' : 'Archive'}
                            </span>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                              <Icon name="play_circle" className="w-7 h-7 text-on-surface" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-label-md text-label-md truncate">{item.title}</p>
                          {item.year && <p className="text-on-surface-variant/40 text-xs mt-1">{item.year}</p>}
                        </div>
                      </div>
                    )
                  }
                  return <HoverCard key={`${item.id}-${item.type}`} item={item} index={i} className="w-full min-w-0" />
                })}
              </div>
            </>
          )}
        </div>

        {!loading && filtered.length === 0 && recs.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/5">
            <RecommendationGrid
              title="You May Want to Check Out"
              subtitle="Personalized recommendations based on your watch history"
            >
              {recs.map((item, i) => (
                <div key={`rec-${item.id}-${item.type}`} className="min-w-0">
                  <HoverCard item={item} index={i} className="w-full min-w-0" />
                </div>
              ))}
            </RecommendationGrid>
          </div>
        )}
      </div>
    </div>
  )
}
