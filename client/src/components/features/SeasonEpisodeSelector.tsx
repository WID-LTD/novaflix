import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTVSeason } from '../../lib/api'
import type { Season } from '../../types'
import Skeleton from '../ui/Skeleton'

interface SeasonEpisodeSelectorProps {
  id: string
  seasons: Season[]
  onSelect: (season: number, episode: number) => void
  defaultSeason?: number
  defaultEpisode?: number
}

export default function SeasonEpisodeSelector({
  id,
  seasons,
  onSelect,
  defaultSeason,
  defaultEpisode,
}: SeasonEpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(defaultSeason || seasons[0]?.season || 1)

  const { data, isLoading } = useQuery({
    queryKey: ['tv-season', id, selectedSeason],
    queryFn: () => getTVSeason(id, selectedSeason.toString()),
    enabled: !!id,
  })

  const episodes = data?.episodes || []

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-400 font-medium">Season</label>
        <select
          value={selectedSeason}
          onChange={(e) => {
            setSelectedSeason(Number(e.target.value))
          }}
          className="bg-surface-card border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-accent"
        >
          {seasons.map((s) => (
            <option key={s.season} value={s.season}>
              {s.name || `Season ${s.season}`}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-12 rounded-lg" />
          ))}
        </div>
      ) : episodes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {episodes.map((ep) => (
            <button
              key={ep.episode}
              onClick={() => onSelect(selectedSeason, ep.episode)}
              className="flex items-center gap-2 px-3 py-2.5 bg-surface-card border border-white/10 rounded-xl text-left hover:border-accent/50 hover:bg-accent/5 transition-all duration-200"
            >
              <span className="text-xs text-gray-500 font-mono shrink-0">
                {ep.episode.toString().padStart(2, '0')}
              </span>
              <span className="text-sm text-gray-300 truncate">{ep.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No episodes found</p>
      )}
    </div>
  )
}
