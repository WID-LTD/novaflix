import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Plus, Check, Share2 } from 'lucide-react'
import type { MediaDetails } from '../../types'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import RatingBadge from '../ui/RatingBadge'
import Skeleton from '../ui/Skeleton'
import { useStore } from '../../store/useStore'
import { useToast } from '../ui/Toast'

interface HeroBannerProps {
  item: MediaDetails | null
  loading?: boolean
}

export default function HeroBanner({ item, loading }: HeroBannerProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const { watchlist, addToWatchlist, removeFromWatchlist } = useStore()

  if (loading || !item) {
    return (
      <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh]">
        <Skeleton variant="hero" className="w-full h-full rounded-none" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <Skeleton variant="text" className="w-96 h-12 mb-4" />
          <Skeleton variant="text" className="w-64 h-4 mb-2" />
          <Skeleton variant="text" className="w-full max-w-xl h-4 mb-6" />
          <div className="flex gap-3">
            <Skeleton variant="text" className="w-32 h-10 rounded-lg" />
            <Skeleton variant="text" className="w-32 h-10 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  const backdrop = item.backdrop
    ? `https://image.tmdb.org/t/p/original${item.backdrop}`
    : null

  const inWatchlist = watchlist.some((w) => w.id === item.id)

  const handleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(item.id)
      toast.info('Removed from watchlist')
    } else {
      addToWatchlist({
        id: item.id,
        title: item.title,
        poster: item.poster,
        type: item.type,
        year: item.year,
      })
      toast.success('Added to watchlist')
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/${item.type}/${item.id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard')
  }

  const runtimeStr = item.runtime
    ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`
    : null

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh]">
      {backdrop ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img
            src={backdrop}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/80 via-transparent to-transparent" />
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-surface" />
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-hero font-bold text-white mb-4 leading-tight">
            {item.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-300">
            <RatingBadge rating={item.rating} />
            <span className="text-gray-500">|</span>
            <span>{item.year}</span>
            {runtimeStr && (
              <>
                <span className="text-gray-500">|</span>
                <span>{runtimeStr}</span>
              </>
            )}
          </div>

          {item.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.genres.slice(0, 4).map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-gray-400 text-sm md:text-base line-clamp-2 md:line-clamp-3 mb-6 max-w-2xl leading-relaxed">
            {item.overview}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() =>
                navigate(`/watch?id=${item.id}&type=${item.type}`)
              }
            >
              <Play className="w-5 h-5 fill-current" /> Watch Now
            </Button>

            {item.trailerKey && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  window.open(
                    `https://www.youtube.com/watch?v=${item.trailerKey}`,
                    '_blank'
                  )
                }
              >
                <Play className="w-5 h-5" /> Trailer
              </Button>
            )}

            <Button variant="ghost" size="lg" onClick={handleWatchlist}>
              {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="lg" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
