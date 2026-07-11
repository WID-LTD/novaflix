import { useState, useEffect } from 'react'
import { Tv, TrendingUp, Star, Flame } from 'lucide-react'
import { searchMedia } from '../lib/api'
import Tabs from '../components/ui/Tabs'
import ContentRow from '../components/features/ContentRow'
import type { MediaItem } from '../types'

const categories = [
  { id: 'trending', label: 'Trending', keyword: 'stranger things', icon: Flame },
  { id: 'popular', label: 'Popular', keyword: 'game of thrones', icon: TrendingUp },
  { id: 'top_rated', label: 'Top Rated', keyword: 'breaking bad', icon: Star },
  { id: 'new', label: 'New Releases', keyword: '2024', icon: Tv },
]

const genreTabs = [
  { id: 'all', label: 'All' },
  { id: 'action', label: 'Action' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'drama', label: 'Drama' },
  { id: 'sci-fi', label: 'Sci-Fi' },
  { id: 'horror', label: 'Horror' },
]

export default function TVShows() {
  const [activeTab, setActiveTab] = useState('all')
  const [sections, setSections] = useState<Record<string, MediaItem[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results: Record<string, MediaItem[]> = {}
      for (const cat of categories) {
        try {
          const res = await searchMedia(cat.keyword, 'tv')
          if (res.success) {
            results[cat.id] = res.data.slice(0, 20)
          }
        } catch {}
      }
      setSections(results)
      setLoading(false)
    }
    load()
  }, [])

  const genreMap: Record<string, string> = {
    action: 'mission impossible',
    comedy: 'the office',
    drama: 'this is us',
    'sci-fi': 'black mirror',
    horror: 'the walking dead',
  }

  const [genreItems, setGenreItems] = useState<MediaItem[]>([])
  const [genreLoading, setGenreLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'all') {
      setGenreItems([])
      return
    }
    async function load() {
      setGenreLoading(true)
      try {
        const res = await searchMedia(genreMap[activeTab] || activeTab, 'tv')
        if (res.success) setGenreItems(res.data.slice(0, 20))
      } catch {}
      setGenreLoading(false)
    }
    load()
  }, [activeTab])

  return (
    <div className="min-h-screen pt-6 md:pt-10">
      <div className="px-4 md:px-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Tv className="w-8 h-8 text-accent" />
          <h1 className="text-3xl md:text-section font-bold">TV Shows</h1>
        </div>
        <Tabs
          tabs={genreTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="inline-flex"
        />
      </div>

      {activeTab === 'all' ? (
        categories.map((cat) => (
          <ContentRow
            key={cat.id}
            title={cat.label}
            items={sections[cat.id] || []}
            loading={loading}
            link={`/discover?sort=${cat.id}&type=tv`}
          />
        ))
      ) : (
        <ContentRow
          title={genreTabs.find((t) => t.id === activeTab)?.label || ''}
          items={genreItems}
          loading={genreLoading}
          link={`/discover?genre=${activeTab}&type=tv`}
        />
      )}
    </div>
  )
}
