import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HookItem } from '../../types'
import Icon from '../ui/Icon'
import { likeShort, bookmarkShort, shareShort, followUser, recordShortView } from '../../lib/auth'
interface HooksCardProps {
  item: HookItem
  active: boolean
  creatorAvatar?: string | null
  audioTrackName?: string
  commentsCount?: number
  onOpenComments?: () => void
  onShare?: () => void
  onEnded?: () => void
}

export default function HooksCard({
  item,
  active,
  creatorAvatar,
  audioTrackName,
  commentsCount = 0,
  onOpenComments,
  onShare,
  onEnded,
}: HooksCardProps) {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [posterHidden, setPosterHidden] = useState(false)
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(item.liked ?? false)
  const [likeCount, setLikeCount] = useState(item.likesCount ?? item.likes ?? 0)
  const [isLiking, setIsLiking] = useState(false)
  const [following, setFollowing] = useState(item.following ?? false)
  const [followSending, setFollowSending] = useState(false)
  const [bookmarked, setBookmarked] = useState(item.bookmarked ?? false)
  const [bookmarkCount, setBookmarkCount] = useState(item.bookmarksCount ?? 0)
  const [bookmarkSending, setBookmarkSending] = useState(false)
  const [sharesCount, setSharesCount] = useState(item.shares ?? 0)

  // Realtime sync: keep local counts/follow state in step with the feed item (WS pushes)
  useEffect(() => {
    const nextLikes = Number(item.likesCount ?? item.likes)
    if (!Number.isNaN(nextLikes)) setLikeCount(nextLikes)
    const nextShares = Number(item.shares)
    if (!Number.isNaN(nextShares)) setSharesCount(nextShares)
    const nextBookmarks = Number(item.bookmarksCount)
    if (!Number.isNaN(nextBookmarks)) setBookmarkCount(nextBookmarks)
  }, [item.id, item.likesCount, item.likes, item.shares, item.bookmarksCount])

  useEffect(() => {
    setLiked(item.liked ?? liked)
    setBookmarked(item.bookmarked ?? bookmarked)
    setFollowing(item.following ?? following)
  }, [item.id, item.liked, item.bookmarked, item.following])

  useEffect(() => {
    const video = videoRef.current
    if (!video || item.type !== 'short') return
    if (active) {
      video.play().catch(() => {})
      setPosterHidden(true)
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [active, item.type])

  useEffect(() => {
    const video = videoRef.current
    if (!video || item.type !== 'short' || !active) return
    video.muted = muted
  }, [muted, active, item.type])

  useEffect(() => {
    if (item.type !== 'short' || !active || !item.shortId) return
    if (viewedShortIds.has(item.shortId)) return
    viewedShortIds.add(item.shortId)
    recordShortView(item.shortId).catch(() => {})
  }, [active, item.type, item.shortId])

  const toggleMute = () => {
    setMuted(!muted)
    if (videoRef.current) {
      videoRef.current.muted = !muted
    }
  }

  const handleShortLike = async () => {
    if (!item.shortId || isLiking) return
    const wasLiked = liked
    const wasCount = Number(likeCount) || 0
    setIsLiking(true)
    setLiked(!wasLiked)
    setLikeCount(wasLiked ? Math.max(wasCount - 1, 0) : wasCount + 1)
    const res = await likeShort(item.shortId)
    if (res.success) {
      setLiked(res.liked)
      setLikeCount(Number(res.likes) || 0)
    } else {
      setLiked(wasLiked)
      setLikeCount(wasCount)
    }
    setIsLiking(false)
  }

  const handleBookmark = async () => {
    if (!item.shortId || bookmarkSending) return
    const prevBookmarked = bookmarked
    const prevCount = Number(bookmarkCount) || 0
    setBookmarkSending(true)
    setBookmarked(!prevBookmarked)
    setBookmarkCount(prevBookmarked ? Math.max(prevCount - 1, 0) : prevCount + 1)
    const res = await bookmarkShort(item.shortId)
    if (res.success) {
      setBookmarked(res.bookmarked)
      setBookmarkCount(Number(res.bookmarks) || 0)
    } else {
      setBookmarked(prevBookmarked)
      setBookmarkCount(prevCount)
    }
    setBookmarkSending(false)
  }

  const handleFollow = async () => {
    if (!item.creatorId || followSending) return
    const prev = following
    setFollowSending(true)
    setFollowing(true)
    const res = await followUser(item.creatorId)
    if (res.success) {
      setFollowing(res.following)
    } else {
      setFollowing(prev)
    }
    setFollowSending(false)
  }

  const handleShare = () => {
    onShare?.()
    if (!item.shortId) return
    shareShort(item.shortId).then(r => {
      if (r.success) setSharesCount(Number(r.shares) || 0)
    })
  }

  if (item.type === 'ad') {
    return (
      <div className="h-full w-full flex-shrink-0 snap-start bg-surface-container flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full bg-accent/20 border border-premium/30 flex items-center justify-center mx-auto mb-4">
            <Icon name="workspace_premium" className="w-8 h-8 text-primary-container" />
          </div>
          <p className="text-on-surface-variant text-sm">Sponsored Content</p>
          <p className="text-on-surface-variant/60 text-xs mt-1">Upgrade to Premium for fewer ads</p>
        </div>
      </div>
    )
  }

  const isShort = item.type === 'short'
  const trackName = isShort ? (audioTrackName || `Original Audio · ${item.creatorName || 'Novaflix'}`) : undefined

  return (
    <div className="h-full w-full flex-shrink-0 snap-start relative bg-black">
      {/* Video / Poster */}
      <div className="absolute inset-0 flex items-center justify-center">
        {item.poster && !posterHidden && (
          <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
        )}
        <video
            ref={videoRef}
            src={item.videoUrl || undefined}
            poster={item.poster || undefined}
            className="w-full h-full object-cover"
            playsInline
            loop
            preload="metadata"
            muted={muted}
            onCanPlay={() => { if (active) videoRef.current?.play().catch(() => {}) }}
          />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

      {/* Mute / unmute — top left */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 active:scale-90 transition-all"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        <Icon name={muted ? 'volume_off' : 'volume_up'} className="text-white" />
      </button>

      {/* Interaction stack */}
      <div className="absolute right-4 bottom-24 md:bottom-28 flex flex-col items-center gap-5 md:gap-6 z-10">
        {/* Profile target with layered plus badge */}
        <button
          type="button"
          className="relative"
          onClick={() => { if (isShort && item.creatorName) navigate(`/profile/${item.creatorName}`) }}
          aria-label={item.creatorName ? `View ${item.creatorName}` : 'View profile'}
        >
          <span className="w-12 h-12 rounded-full border-2 border-white bg-neutral-700 flex items-center justify-center overflow-hidden">
            {item.creatorAvatar || creatorAvatar ? (
              <img src={item.creatorAvatar || creatorAvatar || undefined} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icon name="person" size="lg" className="text-white/80" />
            )}
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); handleFollow() }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleFollow() } }}
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 ${
              following ? 'bg-[#4caf50] scale-0' : 'bg-[#e50914] scale-100'
            }`}
            aria-label={following ? 'Following' : 'Follow creator'}
          >
            {following ? (
              <Icon name="check" className="text-white !text-xs" />
            ) : (
              <Icon name="add" className="text-white !text-xs" />
            )}
          </span>
        </button>

        {/* Like */}
        <button
          onClick={handleShortLike}
          disabled={isLiking}
          className="flex flex-col items-center gap-1 group"
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <Icon
            name={liked ? 'favorite' : 'favorite_border'}
            fill={liked}
            size="lg"
            className={`transition-all duration-200 ${liked ? 'text-[#e50914] scale-110' : 'text-white group-hover:text-red-400'}`}
          />
          <span className="text-xs text-white font-medium">{likeCount.toLocaleString()}</span>
        </button>

        {/* Comments */}
        <button
          onClick={onOpenComments}
          className="flex flex-col items-center gap-1 group"
          aria-label="Comments"
        >
          <Icon
            name="chat_bubble"
            size="lg"
            className="text-white group-hover:text-red-400 transition-colors"
          />
          <span className="text-xs text-white font-medium">{(item.commentsCount ?? commentsCount).toLocaleString()}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          disabled={bookmarkSending}
          className="flex flex-col items-center gap-1 group"
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Icon
            name={bookmarked ? 'bookmark' : 'bookmark_border'}
            fill={bookmarked}
            size="lg"
            className={`transition-all duration-200 ${bookmarked ? 'text-[#f5c518] scale-110' : 'text-white group-hover:text-amber-400'}`}
          />
          <span className="text-xs text-white font-medium">{bookmarkCount.toLocaleString()}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 group" aria-label="Share">
          <Icon name="share" size="lg" className="text-white group-hover:text-red-400 transition-colors" />
          <span className="text-xs text-white font-medium">{sharesCount.toLocaleString()}</span>
        </button>
      </div>

      {/* Content footnote */}
      <div className="absolute left-4 bottom-4 right-16 text-white z-10">
        {item.promoted && (
          <span className="text-[10px] uppercase tracking-wider text-primary-container bg-primary-container/20 px-2 py-0.5 rounded font-semibold mb-1.5 inline-block">
            Sponsored
          </span>
        )}

        {isShort ? (
          <>
            <h2 className="font-bold text-sm md:text-base text-white truncate">
              @{item.creatorName || item.title.replace(/\s+/g, '')}
            </h2>

            {item.description && (
              <p className="text-xs md:text-sm line-clamp-2 mb-2 leading-relaxed text-white/90">
                {item.description}{' '}
                {(item.hashtags?.length ? item.hashtags : ['fyp', 'novaflix', 'shorts']).map((tag, i) => (
                  <span key={i} className="text-[#ffb4aa] font-semibold">#{tag} </span>
                ))}
              </p>
            )}

            {trackName && (
              <div className="flex items-center gap-2 overflow-hidden">
                <Icon name="music_note" size="sm" className="text-white shrink-0 animate-spin-music" />
                <div className="overflow-hidden flex-1">
                  <div className="animate-marquee inline-flex whitespace-nowrap">
                    <span className="pr-8 text-xs md:text-sm text-white/80">{trackName}</span>
                    <span className="pr-8 text-xs md:text-sm text-white/80">{trackName}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-sm md:text-base text-white truncate">{item.title}</h2>
              {item.creatorName && (
                <span className="text-sm md:text-base text-white/70 shrink-0">@{item.creatorName}</span>
              )}
            </div>

            {item.mediaId && (
              <button
                onClick={() => navigate(`/${item.mediaType === 'tv' ? 'tv' : 'movie'}/${item.mediaId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-xl font-semibold text-sm hover:brightness-110 active:scale-95 transition-all mb-2"
              >
                <Icon name="play_arrow" fill={true} /> Watch Full Movie
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

let viewedShortIds = new Set<string>()
