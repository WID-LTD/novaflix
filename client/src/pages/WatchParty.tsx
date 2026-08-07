import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Hls from 'hls.js'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { getTrendingFeed, getGenres, getCategoryMovies, searchMedia, getDetails, getTVSeason, getStreamSource } from '../lib/api'
import type { MediaItem, MediaDetails, Season, Episode } from '../types'

let idCounter = 0
const nextId = () => ++idCounter

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzJhMmEyYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzdhN2E3YSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIFBvc3RlcjwvdGV4dD48L3N2Zz4='

interface ChatMsg {
  userId: string
  name: string
  message: string
  timestamp: number
}

function ContentCard({ item, selected, onSelect, compact }: {
  item: MediaItem
  selected: boolean
  onSelect: () => void
  compact?: boolean
}) {
  const posterSrc = item.poster
    ? `https://image.tmdb.org/t/p/w342${item.poster}`
    : PLACEHOLDER

  if (compact) {
    return (
      <button
        onClick={onSelect}
        className={`shrink-0 w-28 rounded-lg overflow-hidden border-2 transition-all ${
          selected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-white/20'
        }`}
      >
        <div className="aspect-[2/3] bg-surface-container">
          <img src={posterSrc} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="p-1.5 bg-surface">
          <p className="text-[10px] font-medium text-on-surface truncate">{item.title}</p>
          <p className="text-[9px] text-on-surface-variant/60">{item.year}</p>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onSelect}
      className={`rounded-xl overflow-hidden border-2 transition-all ${
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-white/5 hover:border-white/20'
      }`}
    >
      <div className="aspect-[2/3] bg-surface-container relative">
        <img src={posterSrc} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        {item.type === 'tv' && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 text-[9px] font-bold text-white rounded">TV</span>
        )}
      </div>
      <div className="p-2 bg-surface-card">
        <p className="text-xs font-semibold text-on-surface truncate">{item.title}</p>
        <p className="text-[10px] text-on-surface-variant/60">{item.year}</p>
      </div>
    </button>
  )
}

function EpisodeList({ episodes, selectedEpisode, onSelect }: {
  episodes: Episode[]
  selectedEpisode: number | null
  onSelect: (ep: number) => void
}) {
  return (
    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
      {episodes.map((ep) => (
        <button
          key={ep.episode}
          onClick={() => onSelect(ep.episode)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedEpisode === ep.episode
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'hover:bg-white/5 text-on-surface-variant border border-transparent'
          }`}
        >
          <span className="font-mono text-xs opacity-60 mr-2">E{ep.episode.toString().padStart(2, '0')}</span>
          {ep.name}
        </button>
      ))}
    </div>
  )
}

export default function WatchParty() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, planFeatures } = useAuth()
  const toast = useToast()

  // Room state
  const wsRef = useRef<WebSocket | null>(null)
  const [roomCode, setRoomCode] = useState(searchParams.get('room') || '')
  const [joined, setJoined] = useState(!!searchParams.get('room'))
  const [connectedUsers, setConnectedUsers] = useState<string[]>([])
  const [watching, setWatching] = useState(false)
  const [streamUrl, setStreamUrl] = useState('')
  const [streamLoading, setStreamLoading] = useState(false)

  // Content browsing
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'movie' | 'tv'>('movie')
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([])
  const [trending, setTrending] = useState<{ movies: MediaItem[]; tv: MediaItem[] }>({ movies: [], tv: [] })
  const [genreResults, setGenreResults] = useState<MediaItem[]>([])
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [activeView, setActiveView] = useState<'trending' | 'genre' | 'search'>('trending')
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [browsingType, setBrowsingType] = useState<'movie' | 'tv'>('movie')

  // Selected content
  const [selectedContent, setSelectedContent] = useState<MediaItem | null>(null)
  const [selectedDetails, setSelectedDetails] = useState<MediaDetails | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [tvEpisodes, setTvEpisodes] = useState<Episode[]>([])
  const [tvSeasons, setTvSeasons] = useState<Season[]>([])

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatOpen, setChatOpen] = useState(true)

  // Player
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimer = useRef<ReturnType<typeof setTimeout>>()
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSyncRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [loading, setLoading] = useState(true)
  const [cursorHidden, setCursorHidden] = useState(false)

  const [joinInput, setJoinInput] = useState('')

  // ─── WebSocket ──────────────────────────────────────

  const broadcast = useCallback((type: string, payload?: any) => {
    if (!wsRef.current) return
    wsRef.current.send(JSON.stringify({ type, room: roomCode, user: { id: user?.id, name: user?.name }, payload }))
  }, [roomCode, user])

  const connect = useCallback((code: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const token = localStorage.getItem('novaflix-token') || ''
    const ws = new WebSocket(`${protocol}//${host}/ws?token=${encodeURIComponent(token)}`)

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'join',
        room: code,
        user: { id: user?.id || 'anon-' + Date.now(), name: user?.name || 'Anonymous' },
      }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        switch (msg.type) {
          case 'joined':
            setConnectedUsers(msg.users || [])
            break
          case 'chat-history':
            setMessages(msg.messages || [])
            break
          case 'user-joined':
            setConnectedUsers((prev) => [...prev, msg.userId])
            break
          case 'user-left':
            setConnectedUsers((prev) => prev.filter((id) => id !== msg.userId))
            break
          case 'chat':
            setMessages((prev) => [...prev, {
              userId: msg.userId,
              name: msg.name || 'Anonymous',
              message: msg.message,
              timestamp: msg.timestamp,
            }])
            break
          case 'content-selected':
            if (watching && msg.payload?.streamUrl && msg.payload.userId !== user?.id) {
              setStreamUrl(msg.payload.streamUrl)
              if (msg.payload.currentTime != null) {
                const video = videoRef.current
                if (video) video.currentTime = msg.payload.currentTime
              }
            }
            break
          case 'sync':
            if (watching && videoRef.current && playerReady && msg.userId !== user?.id) {
              const time = msg.currentTime
              if (Math.abs(time - lastSyncRef.current) > 2) {
                videoRef.current.currentTime = time
                lastSyncRef.current = time
              }
              if (msg.playing && videoRef.current.paused) {
                videoRef.current.play().catch(() => {})
                setPlaying(true)
              } else if (!msg.playing && !videoRef.current.paused) {
                videoRef.current.pause()
                setPlaying(false)
              }
            }
            break
          case 'error':
            toast.error(msg.message)
            setJoined(false)
            break
        }
      } catch {}
    }

    ws.onclose = () => {
      wsRef.current = null
    }

    wsRef.current = ws
  }, [user, toast, playerReady, watching])

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'leave' }))
        wsRef.current.close()
      }
    }
  }, [])

  // ─── Sync broadcast ─────────────────────────────────

  useEffect(() => {
    if (!watching || !wsRef.current || !videoRef.current) return
    syncIntervalRef.current = setInterval(() => {
      const video = videoRef.current
      if (!video) return
      const time = video.currentTime
      const isPlaying = !video.paused
      setCurrentTime(time)
      setPlaying(isPlaying)
      broadcast('sync', { action: isPlaying ? 'play' : 'pause', currentTime: time, playing: isPlaying })
    }, 5000)
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [watching, broadcast])

  // ─── Load genres + trending on mount ────────────────

  useEffect(() => {
    getGenres().then((res) => {
      if (res.success) setGenres(res.data)
    })
    getTrendingFeed().then((res) => {
      if (res.success) setTrending(res.data)
    })
  }, [])

  // ─── Read URL params (auto-join with content) ───────

  useEffect(() => {
    const room = searchParams.get('room')
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    const season = searchParams.get('season')
    const episode = searchParams.get('episode')

    if (room && !joined) {
      setRoomCode(room)
      setJoined(true)
      connect(room)
    }

    if (id && type) {
      getDetails(id, type as 'movie' | 'tv').then((res) => {
        if (res.success && res.data) {
          const item: MediaItem = {
            id: res.data.id,
            title: res.data.title,
            year: res.data.year,
            poster: res.data.poster,
            backdrop: res.data.backdrop,
            overview: res.data.overview,
            type: res.data.type,
            rating: res.data.rating,
          }
          setSelectedContent(item)
          setSelectedDetails(res.data)
          if (res.data.type === 'tv' && res.data.seasons) {
            setTvSeasons(res.data.seasons)
            setSelectedSeason(season ? Number(season) : res.data.seasons[0]?.season || 1)
            setSelectedEpisode(episode ? Number(episode) : null)
          }
        }
      })
    }
  }, [])

  // ─── Auto-join when room is set ─────────────────────

  useEffect(() => {
    if (joined && roomCode && !wsRef.current) {
      connect(roomCode)
    }
  }, [joined, roomCode, connect])

  // ─── Search debounce ────────────────────────────────

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      if (activeView === 'search') setActiveView('trending')
      return
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      const res = await searchMedia(query.trim(), searchType)
      if (res.success) {
        setSearchResults(res.data)
        setActiveView('search')
      }
    }, 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [query, searchType, activeView])

  // ─── Fetch TV episodes when season changes ──────────

  useEffect(() => {
    if (!selectedContent || selectedContent.type !== 'tv' || !selectedSeason) return
    getTVSeason(String(selectedContent.id), String(selectedSeason)).then((res) => {
      if (res.episodes) setTvEpisodes(res.episodes)
    })
  }, [selectedContent, selectedSeason])

  // ─── Genre click handler ────────────────────────────

  const handleGenreSelect = async (genreId: number | null) => {
    setSelectedGenre(genreId)
    if (genreId === null) {
      setGenreResults([])
      setActiveView('trending')
      return
    }
    setActiveView('genre')
    const [movieRes, tvRes] = await Promise.all([
      getCategoryMovies(String(genreId), 'movie'),
      getCategoryMovies(String(genreId), 'tv'),
    ])
    const combined = [
      ...(movieRes.success ? movieRes.data : []),
      ...(tvRes.success ? tvRes.data : []),
    ]
    setGenreResults(combined)
  }

  // ─── Content selection ──────────────────────────────

  const handleContentSelect = async (item: MediaItem) => {
    setSelectedContent(item)
    setSelectedEpisode(null)
    setSelectedSeason(1)
    setTvEpisodes([])
    const res = await getDetails(String(item.id), item.type)
    if (res.success && res.data) {
      setSelectedDetails(res.data)
      if (res.data.type === 'tv' && res.data.seasons) {
        setTvSeasons(res.data.seasons)
        setSelectedSeason(res.data.seasons[0]?.season || 1)
      }
    }
  }

  // ─── Start watching ─────────────────────────────────

  const handleStartWatching = async () => {
    if (!selectedContent) return
    setStreamLoading(true)
    const res = await getStreamSource(
      String(selectedContent.id),
      selectedContent.type,
      selectedContent.type === 'tv' ? String(selectedSeason) : undefined,
      selectedContent.type === 'tv' && selectedEpisode ? String(selectedEpisode) : undefined,
    )
    if (res.success && res.streamUrl) {
      setStreamUrl(res.streamUrl)
      setWatching(true)
      setPlayerReady(false)
      broadcast('content-select', {
        id: selectedContent.id,
        type: selectedContent.type,
        season: selectedContent.type === 'tv' ? selectedSeason : undefined,
        episode: selectedContent.type === 'tv' ? selectedEpisode : undefined,
        streamUrl: res.streamUrl,
      })
    } else {
      toast.error(res.error || 'Failed to load stream')
    }
    setStreamLoading(false)
  }

  // ─── Player lifecycle ───────────────────────────────

  useEffect(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return
    setLoading(true)

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy()
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false)
        setPlayerReady(true)
        video.play().catch(() => setPlaying(false))
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setLoading(false)
          toast.error('Failed to load video stream')
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
      video.addEventListener('loadedmetadata', () => {
        setLoading(false)
        setPlayerReady(true)
        video.play().catch(() => setPlaying(false))
      })
    } else {
      setLoading(false)
      toast.error('HLS playback is not supported in this browser')
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy()
    }
  }, [streamUrl])

  // ─── Video event listeners ──────────────────────────

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    const onLoadedMeta = () => setDuration(video.duration)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onWaiting = () => setLoading(true)
    const onCanPlay = () => setLoading(false)

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMeta)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('canplay', onCanPlay)

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMeta)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('canplay', onCanPlay)
    }
  }, [])

  // ─── Auto-hide cursor ──────────────────────────────

  useEffect(() => {
    if (!watching) {
      document.body.style.cursor = ''
      setCursorHidden(false)
      return
    }
    let timer: ReturnType<typeof setTimeout>
    const show = () => {
      document.body.style.cursor = ''
      setCursorHidden(false)
      clearTimeout(timer)
      if (playing) {
        timer = setTimeout(() => {
          document.body.style.cursor = 'none'
          setCursorHidden(true)
        }, 3000)
      }
    }
    document.addEventListener('mousemove', show)
    document.addEventListener('mousedown', show)
    document.addEventListener('keydown', show)
    return () => {
      document.removeEventListener('mousemove', show)
      document.removeEventListener('mousedown', show)
      document.removeEventListener('keydown', show)
      clearTimeout(timer)
      document.body.style.cursor = ''
    }
  }, [watching, playing])

  // ─── Keyboard shortcuts (watching) ─────────────────

  useEffect(() => {
    if (!watching) return
    const handler = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (video.paused) { video.play().catch(() => {}); setPlaying(true) }
          else { video.pause(); setPlaying(false) }
          broadcast('sync', { action: video.paused ? 'pause' : 'play', currentTime: video.currentTime, playing: !video.paused })
          break
        case 'f':
          toggleFullscreen()
          break
        case 'm':
          video.muted = !muted
          setMuted(!muted)
          break
        case 'c':
        case 'C':
          setChatOpen(v => !v)
          break
        case 'ArrowLeft':
          video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
          video.currentTime = Math.min(duration, video.currentTime + 10)
          break
        case 'ArrowUp':
          video.volume = Math.min(1, video.volume + 0.1)
          setVolume(video.volume)
          break
        case 'ArrowDown':
          video.volume = Math.max(0, video.volume - 0.1)
          setVolume(video.volume)
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [watching, muted, duration, broadcast])

  // ─── Player controls ────────────────────────────────

  const resetControls = useCallback(() => {
    setShowControls(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    if (playing) {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [playing])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { video.play().catch(() => {}); setPlaying(true) }
    else { video.pause(); setPlaying(false) }
    broadcast('sync', { action: video.paused ? 'pause' : 'play', currentTime: video.currentTime, playing: !video.paused })
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * duration
    broadcast('sync', { action: 'seek', currentTime: video.currentTime, playing: !video.paused })
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const val = parseFloat(e.target.value)
    video.volume = val
    setVolume(val)
    setMuted(val === 0)
  }

  // ─── Chat ───────────────────────────────────────────

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !wsRef.current) return
    broadcast('chat', { message: chatInput, name: user?.name || 'Anonymous' })
    setChatInput('')
  }

  const copyLink = () => {
    const link = `${window.location.origin}/watch-party?room=${roomCode}`
    navigator.clipboard.writeText(link)
    toast.success('Invite link copied!')
  }

  const createRoom = () => {
    const code = generateRoomCode()
    setRoomCode(code)
    setJoined(true)
    setSearchParams({ room: code }, { replace: true })
  }

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinInput.length < 4) return
    const code = joinInput.toUpperCase()
    setRoomCode(code)
    setJoined(true)
    setSearchParams({ room: code }, { replace: true })
  }

  // ─── Premium check ──────────────────────────────────

  if (!planFeatures.premierAccess) {
    return (
      <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav flex items-center justify-center">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-accent/10 mb-4">
            <Icon name="workspace_premium" className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-display-sm font-bold mb-3">
            Premium <span className="text-accent">Feature</span>
          </h1>
          <p className="text-on-surface-variant mb-8">Watch Parties are available exclusively on the Premium plan.</p>
          <Button size="lg" className="w-full max-w-xs mx-auto" onClick={() => navigate('/pricing')}>
            Upgrade to Premium
          </Button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // WATCHING VIEW
  // ════════════════════════════════════════════════════════

  if (watching && streamUrl) {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
      <div
        ref={containerRef}
        className="fixed inset-0 bg-black z-50"
        onMouseMove={resetControls}
        onMouseLeave={() => playing && setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-contain cursor-default"
          onClick={togglePlay}
          playsInline
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Top bar */}
        <div
          className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-4 px-6 pb-12 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setWatching(false); if (hlsRef.current) hlsRef.current.destroy() }}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
              >
                <Icon name="arrow_back" />
              </button>
              <div>
                <span className="text-white/90 text-sm font-medium">{selectedContent?.title}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-label-xs text-white/60 bg-white/10 px-2 py-0.5 rounded">{roomCode}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/50">{connectedUsers.length} watching</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(v => !v)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-sm transition-colors ${
                chatOpen ? 'bg-primary/30 text-primary' : 'bg-black/50 text-white/70 hover:bg-black/70'
              }`}
              title="Toggle chat (C)"
            >
              <Icon name="chat" />
            </button>
          </div>
        </div>

        {/* Bottom controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-6 px-6 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="relative h-1 bg-white/20 rounded-full mb-4 cursor-pointer group/seek" onClick={handleSeek}>
            <div className="absolute h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/seek:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, marginLeft: -6 }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-accent transition-colors w-10 h-10 flex items-center justify-center" aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Icon name="pause" /> : <Icon name="play_arrow" />}
              </button>
              <span className="text-xs text-white/70 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !muted; setMuted(!muted) } }} className="text-white/70 hover:text-white transition-colors w-8 h-8 flex items-center justify-center" aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted || volume === 0 ? <Icon name="volume_off" size="sm" /> : <Icon name="volume_up" size="sm" />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={handleVolumeChange} className="w-16 h-1 accent-accent" />
              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors w-8 h-8 flex items-center justify-center" aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                {fullscreen ? <Icon name="fullscreen_exit" size="sm" /> : <Icon name="fullscreen" size="sm" />}
              </button>
            </div>
          </div>
        </div>

        {/* Chat overlay */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="absolute top-0 right-0 bottom-0 w-80 bg-black/80 backdrop-blur-md border-l border-white/10 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white">Party Chat</h3>
                <span className="text-xs text-white/50">{connectedUsers.length} watching</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-white/30">No messages yet</div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-primary font-medium mr-1.5">{msg.name}:</span>
                      <span className="text-white/70">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={sendChat} className="p-3 border-t border-white/10 flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Chat..."
                  className="flex-1 bg-white/10 text-xs text-white px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-primary placeholder-white/30"
                />
                <button type="submit" disabled={!chatInput.trim()} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50">
                  Send
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard shortcuts hint */}
        <div
          className={`absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 transition-opacity duration-300 ${
            showControls && !chatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3 text-[10px] text-white/50">
            <span><kbd className="bg-white/10 px-1 rounded text-white/70">Space</kbd> Play/Pause</span>
            <span><kbd className="bg-white/10 px-1 rounded text-white/70">F</kbd> Fullscreen</span>
            <span><kbd className="bg-white/10 px-1 rounded text-white/70">C</kbd> Chat</span>
            <span><kbd className="bg-white/10 px-1 rounded text-white/70">←→</kbd> Seek</span>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // LOBBY VIEW (joined, not watching)
  // ════════════════════════════════════════════════════════

  if (joined) {
    return (
      <div className="min-h-screen bg-surface">
        {/* Room header */}
        <div className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => { setJoined(false); setRoomCode(''); setSearchParams({}, { replace: true }); if (wsRef.current) { wsRef.current.send(JSON.stringify({ type: 'leave' })); wsRef.current.close() } }}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-on-surface-variant hover:bg-white/10 transition-colors"
              >
                <Icon name="arrow_back" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-on-surface">Watch Party</h1>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant/60">
                  <span className="font-mono text-primary font-bold">{roomCode}</span>
                  <span>·</span>
                  <span>{connectedUsers.length} connected</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <Icon name="content_copy" size="sm" /> Invite
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search movies & TV shows..."
                className="w-full bg-surface-container-high border border-white/10 text-on-surface rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-primary placeholder-on-surface-variant/40"
              />
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size="sm" />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface">
                  <Icon name="close" size="sm" />
                </button>
              )}
            </div>
            {query && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setSearchType('movie')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    searchType === 'movie' ? 'bg-primary text-on-primary' : 'bg-white/10 text-on-surface-variant hover:bg-white/20'
                  }`}
                >Movies</button>
                <button
                  onClick={() => setSearchType('tv')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    searchType === 'tv' ? 'bg-primary text-on-primary' : 'bg-white/10 text-on-surface-variant hover:bg-white/20'
                  }`}
                >TV Shows</button>
              </div>
            )}
          </div>

          {/* Genre chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            <button
              onClick={() => handleGenreSelect(null)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedGenre === null && activeView !== 'search' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-white/20 border border-white/10'
              }`}
            >All</button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => handleGenreSelect(g.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedGenre === g.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-white/20 border border-white/10'
                }`}
              >{g.name}</button>
            ))}
          </div>

          {/* Content area */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {activeView === 'search' && searchResults.map((item) => (
              <ContentCard key={`${item.id}-${item.type}`} item={item} selected={selectedContent?.id === item.id && selectedContent?.type === item.type} onSelect={() => handleContentSelect(item)} />
            ))}

            {activeView === 'genre' && genreResults.map((item) => (
              <ContentCard key={`${item.id}-${item.type}`} item={item} selected={selectedContent?.id === item.id && selectedContent?.type === item.type} onSelect={() => handleContentSelect(item)} />
            ))}

            {activeView === 'trending' && !query && (
              <>
                {trending.movies.map((item) => (
                  <ContentCard key={`movie-${item.id}`} item={item} selected={selectedContent?.id === item.id && selectedContent?.type === 'movie'} onSelect={() => handleContentSelect(item)} />
                ))}
                {trending.tv.map((item) => (
                  <ContentCard key={`tv-${item.id}`} item={item} selected={selectedContent?.id === item.id && selectedContent?.type === 'tv'} onSelect={() => handleContentSelect(item)} />
                ))}
              </>
            )}
          </div>

          {/* Selection panel */}
          <AnimatePresence>
            {selectedContent && selectedDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-surface-container-high border border-white/10 rounded-xl p-4 md:p-6 mb-6"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="shrink-0 w-24 md:w-32">
                    <div className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-container">
                      <img
                        src={selectedContent.poster ? `https://image.tmdb.org/t/p/w185${selectedContent.poster}` : PLACEHOLDER}
                        alt={selectedContent.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-on-surface">{selectedContent.title}</h2>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">
                      {selectedContent.year} · {selectedContent.type === 'movie' ? 'Movie' : 'TV Series'} · {selectedDetails.rating.toFixed(1)} rating
                    </p>
                    <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{selectedContent.overview}</p>
                    {selectedDetails.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedDetails.genres.map((g) => (
                          <span key={g} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-on-surface-variant/70">{g}</span>
                        ))}
                      </div>
                    )}

                    {selectedContent.type === 'tv' && tvSeasons.length > 0 && (
                      <div className="mt-3 flex flex-col sm:flex-row gap-3">
                        <div>
                          <label className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider font-medium">Season</label>
                          <select
                            value={selectedSeason}
                            onChange={(e) => { setSelectedSeason(Number(e.target.value)); setSelectedEpisode(null) }}
                            className="block mt-1 bg-surface-card border border-white/10 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                          >
                            {tvSeasons.map((s) => (
                              <option key={s.season} value={s.season}>{s.name || `Season ${s.season}`}</option>
                            ))}
                          </select>
                        </div>
                        {tvEpisodes.length > 0 && (
                          <div className="flex-1">
                            <label className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider font-medium">Episode</label>
                            <EpisodeList episodes={tvEpisodes} selectedEpisode={selectedEpisode} onSelect={setSelectedEpisode} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleStartWatching}
                    disabled={streamLoading || (selectedContent.type === 'tv' && selectedEpisode === null)}
                  >
                    {streamLoading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Loading...</>
                    ) : (
                      <><Icon name="play_arrow" fill={true} /> Start Watching</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat bar at bottom */}
        <div className="sticky bottom-0 bg-surface/80 backdrop-blur-md border-t border-white/5">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="chat" className="text-on-surface-variant/40" size="sm" />
              <span className="text-xs text-on-surface-variant/60">Party Chat ({messages.length})</span>
            </div>
            <div className="max-h-24 overflow-y-auto mb-2 space-y-1">
              {messages.slice(-5).map((msg, i) => (
                <p key={i} className="text-xs text-on-surface-variant"><span className="text-primary font-medium">{msg.name}:</span> {msg.message}</p>
              ))}
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-surface-container-high text-xs text-on-surface px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-primary placeholder-on-surface-variant/40"
              />
              <button type="submit" disabled={!chatInput.trim()} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // LANDING VIEW (not joined)
  // ════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container/10 mb-4">
            <Icon name="group" className="w-8 h-8 text-primary-container" />
          </div>
          <h1 className="text-display-sm font-bold mb-3">
            Watch <span className="text-primary">Together</span>
          </h1>
          <p className="text-on-surface-variant">Sync playback and chat with friends in real-time</p>
        </div>

        <div className="bg-surface-container-high border border-white/5 rounded-xl p-8 mb-6">
          <Button size="lg" className="w-full mb-6" onClick={createRoom}>
            <Icon name="group_add" /> Create a Room
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-container-high px-2 text-on-surface-variant">or join existing</span>
            </div>
          </div>

          <form onSubmit={joinRoom} className="flex gap-2">
            <Input
              placeholder="Enter room code"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              className="text-center font-mono uppercase tracking-widest"
              maxLength={6}
            />
            <Button type="submit" variant="secondary" disabled={joinInput.length < 4}>Join</Button>
          </form>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-sm text-on-surface-variant">
          <div><Icon name="play_circle" className="mx-auto mb-1 text-primary-container" /><p>Sync Playback</p></div>
          <div><Icon name="chat" className="mx-auto mb-1 text-primary-container" /><p>Live Chat</p></div>
          <div><Icon name="share" className="mx-auto mb-1 text-primary-container" /><p>Invite Friends</p></div>
        </div>
      </div>
    </div>
  )
}
