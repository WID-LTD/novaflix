import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { MediaItem } from '../../types'
import Badge from '../ui/Badge'
import Icon from '../ui/Icon'
import PremiumBadge from '../ui/PremiumBadge'
import { useStore } from '../../store/useStore'

interface MovieCardProps {
  item: MediaItem
  index?: number
  progress?: number
  duration?: number
  className?: string
  watchUrl?: string
}

export default function MovieCard({ item, index = 0, progress, duration, className, watchUrl }: MovieCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const addToWatchlist = useStore((s) => s.addToWatchlist)
  const removeFromWatchlist = useStore((s) => s.removeFromWatchlist)
  const isInWatchlist = useStore((s) => s.isInWatchlist)

  const inWatchlist = isInWatchlist(item.id)

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (inWatchlist) {
      removeFromWatchlist(item.id)
    } else {
      addToWatchlist({
        id: item.id,
        title: item.title,
        poster: item.poster,
        type: item.type === 'tv' ? 'tv' : 'movie',
        year: item.year,
      })
    }
  }

  const posterUrl = item.poster || ''
  const detailUrl = `/${item.type === 'tv' ? 'tv' : 'movie'}/${item.id}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative snap-start ${
        className ?? 'flex-shrink-0 w-[160px] md:w-[220px]'
      }`}
    >
      <Link to={detailUrl} className="block">
        <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-surface-container card-hover-effect shadow-lg">
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 shimmer" />
          )}
          {posterUrl && !imgError ? (
            <img
              src={posterUrl}
              alt={item.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/60 text-sm p-4 text-center">
              {item.title}
            </div>
          )}

          {item.premium && (
            <div className="absolute top-2 left-2 z-10">
              <PremiumBadge size="sm" />
            </div>
          )}
          {item.promoted && (
            <div className="absolute top-2 right-2 z-10">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary-container/90 text-on-primary-container">
                <Icon name="campaign" className="w-2.5 h-2.5" />
                Promoted
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {(progress !== undefined && (duration ?? 0) > 0) && (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${Math.min((progress / (duration ?? 1)) * 100, 100)}%` }}
                />
              </div>
              <div className="absolute bottom-2 left-2 z-10 bg-black/70 rounded px-1.5 py-0.5 text-[10px] font-bold text-white leading-tight flex flex-col gap-0.5">
                <span>{Math.min(Math.round((progress / (duration ?? 1)) * 100), 100)}%</span>
                <span className="text-[9px] font-normal opacity-90">{Math.round(progress / 60)}m / {Math.round((duration ?? 0) / 60)}m</span>
              </div>
            </>
          )}

          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shadow-lg"
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = watchUrl || `/watch?id=${item.id}&type=${item.type}`
                }}
                aria-label={`Play ${item.title}`}
              >
                <Icon name="play_arrow" fill={true} className="text-on-primary-container" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                onClick={toggleFavorite}
                aria-label={inWatchlist ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Icon name="favorite" fill={inWatchlist} className={inWatchlist ? 'text-red-500' : 'text-white'} />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="mt-2.5 px-1 min-w-0">
          <h3 className="font-label-md text-label-md text-on-surface truncate group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-on-surface-variant shrink-0">{item.year}</span>
            <Badge variant="outline" className="shrink-0">
              {item.type === 'tv' ? 'TV' : 'Movie'}
            </Badge>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
