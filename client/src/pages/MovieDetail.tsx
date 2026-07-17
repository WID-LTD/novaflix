import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getDetails } from '../lib/api'
import { useStore } from '../store/useStore'
import { useAuth } from '../lib/AuthContext'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import RatingBadge from '../components/ui/RatingBadge'
import PremiumBadge from '../components/ui/PremiumBadge'
import Skeleton from '../components/ui/Skeleton'
import Icon from '../components/ui/Icon'
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
  const pathType = window.location.pathname.startsWith('/tv/') ? 'tv' : 'movie'
  const type = (searchParams.get('type') || pathType) as 'movie' | 'tv'
  const { user, planFeatures } = useAuth()
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
    if (!inWatchlist && details) {
      addToWatchlist({
        id: details.id,
        title: details.title,
        poster: details.poster,
        type: details.type,
        year: details.year,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Skeleton variant="hero" className="w-full h-[50vh] rounded-none" />
        <div className="px-margin-mobile md:px-margin-desktop -mt-32 relative z-10">
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
          <p className="text-xl text-on-surface-variant mb-4">Failed to load details</p>
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
      {/* Hero Section */}
      <section className="relative w-full h-[618px] md:h-[751px] overflow-hidden">
        {backdrop ? (
          <div className="absolute inset-0 w-full h-full">
            <img src={backdrop} alt={details.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 hero-gradient" />
            <div className="absolute inset-0 hero-gradient-right" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-surface" />
        )}

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 md:left-8 z-20 p-3 rounded-xl bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
          aria-label="Go back"
        >
          <Icon name="arrow_back" />
        </button>

        <div className="absolute bottom-0 left-0 w-full px-margin-mobile md:px-margin-desktop pb-12 md:pb-24 max-w-4xl z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-bold tracking-widest text-on-surface uppercase">
              {type === 'tv' ? 'TV Series' : 'Original Film'}
            </span>
            <div className="flex items-center gap-1 text-secondary">
              <Icon name="star" fill={true} size="sm" />
              <span className="font-label-md text-label-md">{details.rating.toFixed(1)} Rating</span>
            </div>
          </div>
          <h1 className="text-headline-lg-mobile md:text-display-lg drop-shadow-lg mb-6">{details.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mb-8 text-on-surface-variant font-label-md text-label-md">
            <span className="text-secondary font-bold">{details.year}</span>
            <span className="px-1.5 border border-on-surface-variant rounded text-[10px] py-0.5">18+</span>
            {runtimeStr && <span>{runtimeStr}</span>}
            <span>4K Ultra HD</span>
            <span>Dolby Atmos</span>
          </div>
          <p className="text-body-lg text-on-surface-variant max-w-2xl mb-10 line-clamp-3 md:line-clamp-none">
            {details.overview}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => handleWatch()}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-primary-container text-on-primary-container rounded-lg font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg"
            >
              <Icon name="play_arrow" fill={true} /> Play Now
            </button>
            <button
              disabled={planFeatures.downloadDevices === 0}
              className={`flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-bold text-lg border transition-all shadow-md ${
                planFeatures.downloadDevices === 0
                  ? 'bg-surface-variant/20 text-on-surface/30 border-white/5 cursor-not-allowed'
                  : 'bg-surface-variant/40 backdrop-blur-md text-on-surface border-white/10 hover:bg-surface-variant/60 active:scale-95'
              }`}
              title={planFeatures.downloadDevices === 0 ? 'Upgrade to download' : ''}
            >
              <Icon name="download" /> Download
            </button>
            <button
              onClick={handleAddToWatchlist}
              className="flex items-center justify-center w-14 h-14 bg-surface-variant/40 backdrop-blur-md text-on-surface rounded-full border border-white/10 hover:bg-surface-variant/60 active:scale-90 transition-all"
            >
              <Icon name={inWatchlist ? 'check' : 'add'} />
            </button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="px-margin-mobile md:px-margin-desktop -mt-10 relative z-10 space-y-16 pb-32">
        {/* Info Bento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
          <div className="md:col-span-3 bg-surface-container p-8 rounded-xl border border-white/5 space-y-6">
            {details.trailerKey && (
              <div className="aspect-video rounded-xl overflow-hidden mb-6 bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${details.trailerKey}?autoplay=0&rel=0`}
                  title={`${details.title} Trailer`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <h3 className="text-headline-md">Synopsis</h3>
            <p className="text-body-md text-on-surface-variant leading-relaxed">{details.overview}</p>
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Rating</span>
                <span className="font-label-md text-label-md text-primary">{details.rating.toFixed(1)} / 10</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Year</span>
                <span className="font-label-md text-label-md text-on-surface">{details.year}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Genres</span>
                <span className="font-label-md text-label-md text-on-surface">{details.genres.join(', ')}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Type</span>
                <span className="font-label-md text-label-md text-on-surface">{type === 'tv' ? 'TV Series' : 'Movie'}</span>
              </div>
              {details.rating >= 8 && (
                <div className="sm:col-span-4 pt-2">
                  <PremiumBadge size="md" label="Premium Content" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface-container-high p-8 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Engagement</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-label-sm">Popularity</span>
                  <span className="text-secondary font-bold">#1 Today</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full w-[92%]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-label-sm">Critical Score</span>
                  <span className="text-on-surface font-bold">{Math.round(details.rating * 10)}/100</span>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <button className="w-full py-3 rounded-lg border border-primary/30 text-primary font-label-md hover:bg-primary/10 transition-colors">
                Rate this Movie
              </button>
            </div>
          </div>
        </div>

        {/* Creator Card */}
        <div className="grid md:grid-cols-2 gap-4">
          <CreatorCard
            name="Jane Doe"
            bio="Independent filmmaker & visual storyteller"
            filmCount={4}
            followers={2847}
            location="Los Angeles, CA"
          />
          <TipButton recipientName={details.title} />
        </div>

        {/* Comments */}
        <CommentSection contentId={details.id} contentType={details.type} />

        {/* Season/Episode Selector for TV */}
        {details.type === 'tv' && details.seasons && details.seasons.length > 0 && (
          <div>
            <h2 className="text-headline-md mb-4">Episodes</h2>
            <SeasonEpisodeSelector
              id={id!}
              seasons={details.seasons}
              onSelect={(season, episode) => handleWatch(season, episode)}
            />
          </div>
        )}

        {/* More Like This */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md">More Like This</h2>
            <a className="text-primary font-label-md hover:underline" href="#">View All</a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-gutter">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="movie-card-hover group cursor-pointer relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg bg-surface-container">
                <div className="w-full h-full shimmer" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
