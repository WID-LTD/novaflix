import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Play, Star, Clock, Calendar, ChevronLeft, ShoppingBag,
} from 'lucide-react'
import { getDetails } from '../lib/api'
import { useStore } from '../store/useStore'
import { useAuth } from '../lib/AuthContext'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import RatingBadge from '../components/ui/RatingBadge'
import Skeleton from '../components/ui/Skeleton'
import SeasonEpisodeSelector from '../components/features/SeasonEpisodeSelector'
import TipButton from '../components/ui/TipButton'
import LikeButton from '../components/features/LikeButton'
import CommentSection from '../components/features/CommentSection'
import CreatorCard from '../components/ui/CreatorCard'
import type { MediaDetails } from '../types'

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') || 'movie') as 'movie' | 'tv'
  const { user } = useAuth()
  const addToWatchlist = useStore((s) => s.addToWatchlist)
  const watchlist = useStore((s) => s.watchlist)

  const { data, isLoading, error } = useQuery({
    queryKey: ['details', id, type],
    queryFn: () => getDetails(id!, type),
    enabled: !!id,
  })

  const details = data?.success ? data.data : null

  const inWatchlist = details ? watchlist.some((w) => w.id === details.id) : false

  const handleWatch = (season?: number, episode?: number) => {
    if (!user) {
      navigate(`/login?redirect=/movie/${id}?type=${type}`)
      return
    }
    let url = `/watch?id=${id}&type=${type}`
    if (season) url += `&season=${season}`
    if (episode) url += `&episode=${episode}`
    navigate(url)
  }

  const handleAddToWatchlist = () => {
    if (!user) {
      navigate(`/login?redirect=/movie/${id}?type=${type}`)
      return
    }
    if (!inWatchlist) {
      addToWatchlist({
        id: details!.id,
        title: details!.title,
        poster: details!.poster,
        type: details!.type,
        year: details!.year,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton variant="hero" className="w-full h-[50vh] rounded-none" />
        <div className="px-4 md:px-8 -mt-32 relative z-10">
          <div className="flex gap-8">
            <Skeleton variant="poster" className="w-[200px] hidden md:block" />
            <div className="flex-1">
              <Skeleton variant="text" className="w-96 h-10 mb-4" />
              <Skeleton variant="text" className="w-64 h-4 mb-2" />
              <Skeleton variant="text" className="w-full max-w-xl h-4 mb-6" />
              <Skeleton variant="text" className="w-48 h-10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Failed to load details</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  const backdrop = details.backdrop
    ? `https://image.tmdb.org/t/p/original${details.backdrop}`
    : null

  const poster = details.poster
    ? `https://image.tmdb.org/t/p/w500${details.poster}`
    : null

  const runtimeStr = details.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : null

  return (
    <div className="min-h-screen">
      <div className="relative h-[40vh] md:h-[50vh]">
        {backdrop ? (
          <img
            src={backdrop}
            alt={details.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-surface" />
        )}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/60 via-transparent to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 md:left-8 p-2 rounded-xl bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="relative z-10 px-4 md:px-8 -mt-32 md:-mt-40">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {poster && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="shrink-0 w-[200px] hidden md:block"
            >
              <img
                src={poster}
                alt={details.title}
                className="w-full rounded-2xl shadow-2xl"
              />
            </motion.div>
          )}

          <div className="flex-1 pt-16 md:pt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-3">
                {details.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-400">
                <RatingBadge rating={details.rating} />
                <span className="text-gray-600">|</span>
                <span>{details.year}</span>
                {runtimeStr && (
                  <>
                    <span className="text-gray-600">|</span>
                    <Clock className="w-4 h-4" />
                    <span>{runtimeStr}</span>
                  </>
                )}
                {details.releaseDate && (
                  <>
                    <span className="text-gray-600">|</span>
                    <Calendar className="w-4 h-4" />
                    <span>{details.releaseDate}</span>
                  </>
                )}
              </div>

              {details.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {details.genres.map((genre) => (
                    <Badge key={genre}>{genre}</Badge>
                  ))}
                </div>
              )}

              <p className="text-gray-400 leading-relaxed mb-6 max-w-3xl">
                {details.overview}
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Button
                  size="lg"
                  onClick={() => handleWatch()}
                >
                  <Play className="w-5 h-5 fill-current" /> Watch Now
                </Button>
                {details.trailerKey && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() =>
                      window.open(
                        `https://www.youtube.com/watch?v=${details.trailerKey}`,
                        '_blank'
                      )
                    }
                  >
                    <Play className="w-5 h-5" /> Trailer
                  </Button>
                )}
                <LikeButton
                  contentId={details.id}
                  contentType={details.type}
                  className="px-4 py-2 border border-white/10 rounded-xl hover:border-accent/50"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAddToWatchlist}
                >
                  <Star className="w-5 h-5" />
                  {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </Button>

                <TipButton recipientName={details.title} />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <CreatorCard
                  name="Jane Doe"
                  bio="Independent filmmaker & visual storyteller"
                  filmCount={4}
                  followers={2847}
                  location="Los Angeles, CA"
                />
              </div>

              <div className="mb-8">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-accent" /> Official Merch
                </h3>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {['Classic Tee', 'Poster', 'Cap', 'Mug'].map((item) => (
                    <div
                      key={item}
                      className="flex-shrink-0 w-[120px] bg-surface-card border border-white/10 rounded-xl p-3 text-center hover:border-premium/30 transition-colors"
                    >
                      <div className="w-full aspect-square bg-surface-secondary rounded-lg mb-2 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-gray-600" />
                      </div>
                      <p className="text-xs font-medium text-white truncate">{item}</p>
                      <p className="text-xs text-accent font-semibold mt-1">$19.99</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <CommentSection
                  contentId={details.id}
                  contentType={details.type}
                />
              </div>

              {details.type === 'tv' && details.seasons && details.seasons.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Episodes</h2>
                  <SeasonEpisodeSelector
                    id={id!}
                    seasons={details.seasons}
                    onSelect={(season, episode) => handleWatch(season, episode)}
                  />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}


