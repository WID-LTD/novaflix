import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Heart, Bookmark } from 'lucide-react'
import type { MediaItem } from '../../types'
import Badge from '../ui/Badge'

interface MovieCardProps {
  item: MediaItem
  index?: number
}

export default function MovieCard({ item, index = 0 }: MovieCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const posterUrl = item.poster || ''
  const detailUrl = `/${item.type === 'tv' ? 'tv' : 'movie'}/${item.id}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative flex-shrink-0 w-[160px] md:w-[180px]"
    >
      <Link to={detailUrl} className="block">
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface-card">
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
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm p-4 text-center">
              {item.title}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg"
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = `/watch?id=${item.id}&type=${item.type}`
                }}
              >
                <Play className="w-5 h-5 fill-white text-white ml-0.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                <Heart className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                onClick={(e) => {
                  e.preventDefault()
                }}
              >
                <Bookmark className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="mt-2.5">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-accent transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{item.year}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {item.type === 'tv' ? 'TV' : 'Movie'}
            </Badge>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
