import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'

const demoMovies = [
  { id: 1, title: 'Inception', year: '2010', videoId: 'YoHD9XEInc0' },
  { id: 2, title: 'Interstellar', year: '2014', videoId: 'zSWdZVtXT7E' },
  { id: 3, title: 'The Dark Knight', year: '2008', videoId: 'EXeTwQWrcwY' },
]

interface ChatMsg {
  userId: string
  name: string
  message: string
  timestamp: number
}

export default function WatchParty() {
  const { user, planFeatures } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const wsRef = useRef<WebSocket | null>(null)
  const playerRef = useRef<any>(null)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSyncRef = useRef(0)
  const [roomCode, setRoomCode] = useState('')
  const [joined, setJoined] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null)
  const [watching, setWatching] = useState(false)
  const [users, setUsers] = useState<string[]>([])
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [playerReady, setPlayerReady] = useState(false)

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
            setUsers(msg.users || [])
            break
          case 'user-joined':
            setUsers((prev) => [...prev, msg.userId])
            break
          case 'user-left':
            setUsers((prev) => prev.filter((id) => id !== msg.userId))
            break
          case 'chat':
            setMessages((prev) => [...prev, {
              userId: msg.userId,
              name: msg.name || 'Anonymous',
              message: msg.message,
              timestamp: msg.timestamp,
            }])
            break
          case 'sync':
            if (playerRef.current && playerReady && msg.userId !== user?.id) {
              const time = msg.currentTime
              if (Math.abs(time - lastSyncRef.current) > 2) {
                playerRef.current.seekTo(time, true)
                lastSyncRef.current = time
              }
              if (msg.playing && playerRef.current.getPlayerState?.() !== 1) {
                playerRef.current.playVideo?.()
                setIsPlaying(true)
              } else if (!msg.playing && playerRef.current.getPlayerState?.() !== 2) {
                playerRef.current.pauseVideo?.()
                setIsPlaying(false)
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
  }, [user, toast, playerReady])

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'leave' }))
        wsRef.current.close()
      }
    }
  }, [])

  // Sync pulse — broadcast current time every 5 seconds while watching
  useEffect(() => {
    if (!watching || !wsRef.current || !playerRef.current) return
    syncIntervalRef.current = setInterval(() => {
      if (!playerRef.current) return
      const time = playerRef.current.getCurrentTime?.() ?? 0
      const playing = playerRef.current.getPlayerState?.() === 1
      setCurrentTime(time)
      setIsPlaying(playing)
      wsRef.current?.send(JSON.stringify({
        type: 'sync',
        payload: { action: playing ? 'play' : 'pause', currentTime: time, playing },
      }))
    }, 5000)
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [watching])

  const handlePlayerStateChange = (state: number) => {
    const playing = state === 1
    setIsPlaying(playing)
    if (wsRef.current && playerRef.current) {
      const time = playerRef.current.getCurrentTime?.() ?? 0
      wsRef.current.send(JSON.stringify({
        type: 'sync',
        payload: { action: playing ? 'play' : 'pause', currentTime: time, playing },
      }))
    }
  }

  const handleReady = () => setPlayerReady(true)

  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)
    setJoined(true)
    connect(code)
  }

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputCode.length < 4) return
    setRoomCode(inputCode.toUpperCase())
    setJoined(true)
    connect(inputCode.toUpperCase())
  }

  const copyLink = () => {
    const link = `${window.location.origin}/watch-party?room=${roomCode}`
    navigator.clipboard.writeText(link)
    toast.success('Invite link copied!')
  }

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      payload: { message: chatInput, name: user?.name || 'Anonymous' },
    }))
    setChatInput('')
  }

  const startWatching = () => {
    setWatching(true)
    setPlayerReady(false)
  }

  const selectedMovieData = demoMovies.find(m => m.id === selectedMovie)

  if (joined && watching && selectedMovieData) {
    return (
      <div className="min-h-screen bg-black">
        <div className="relative w-full" style={{ height: 'calc(100vh - 120px)' }}>
          <div id="youtube-player" className="w-full h-full" />
          {/* YouTube IFrame API loaded via useEffect */}
          <YouTubePlayer
            videoId={selectedMovieData.videoId}
            onReady={handleReady}
            onStateChange={handlePlayerStateChange}
            playerRef={playerRef}
          />
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <button onClick={() => { setWatching(false); if (syncIntervalRef.current) clearInterval(syncIntervalRef.current) }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/50 text-white backdrop-blur-sm hover:bg-black/70">
              <Icon name="arrow_back" />
            </button>
            <span className="text-label-sm text-white/80 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">{roomCode} · {users.length} watching</span>
            {isPlaying ? <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> : <span className="w-2 h-2 rounded-full bg-yellow-400" />}
          </div>
          {playerReady && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
              <span className="text-label-sm text-white/80">Sync enabled</span>
              <span className="text-label-xs text-white/50">{formatTime(currentTime)}</span>
            </div>
          )}
        </div>
        <div className="h-30 bg-surface border-t border-white/5 flex">
          <div className="flex-1 p-3">
            <h3 className="font-label-sm text-on-surface mb-2">Party Chat</h3>
            <div className="h-16 overflow-y-auto space-y-1 mb-2">
              {messages.slice(-10).map((msg, i) => (
                <p key={i} className="text-xs text-on-surface-variant"><span className="text-primary font-medium">{msg.name}:</span> {msg.message}</p>
              ))}
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Chat..." className="flex-1 bg-surface-container text-xs text-on-surface px-3 py-1.5 rounded-lg border border-outline/20 focus:outline-none" />
              <button type="submit" disabled={!chatInput.trim()} className="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg text-xs disabled:opacity-50">Send</button>
            </form>
          </div>
          <div className="w-40 p-3 border-l border-white/5">
            <p className="font-label-xs text-on-surface-variant mb-2">Viewers ({users.length})</p>
            {users.map((u, i) => <p key={i} className="text-xs text-on-surface-variant truncate">{u === user?.id ? 'You' : u.slice(0, 8)}</p>)}
          </div>
        </div>
      </div>
    )
  }

  if (joined) {
    return (
      <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-headline-md font-bold text-on-surface">Watch Party</h1>
              <p className="text-on-surface-variant/60 text-sm mt-1">
                Room: <span className="text-primary font-mono font-bold">{roomCode}</span>
                <span className="ml-3 text-on-surface-variant/40">({users.length} connected)</span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <Icon name="content_copy" size="sm" /> Invite
            </Button>
          </div>

          <div className="bg-surface-container-high border border-white/5 rounded-xl p-6 mb-6">
            <h2 className="font-label-md text-label-md text-on-surface mb-4">Choose a Movie</h2>
            <div className="grid md:grid-cols-3 gap-gutter">
              {demoMovies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedMovie === movie.id
                      ? 'border-secondary bg-secondary/10'
                      : 'border-white/5 bg-surface-variant/20 hover:border-white/20'
                  }`}
                >
                  <div className="aspect-[2/3] bg-surface-container rounded-lg mb-3 flex items-center justify-center">
                    <Icon name="play_arrow" className="w-8 h-8 text-on-surface-variant/40" />
                  </div>
                  <p className="font-label-md text-label-md text-on-surface truncate">{movie.title}</p>
                  <p className="text-on-surface-variant/60 text-sm">{movie.year}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="chat" className="text-primary-container" />
              <h2 className="font-label-md text-label-md text-on-surface">Party Chat</h2>
              <span className="text-on-surface-variant/60 text-sm ml-auto">{messages.length} messages</span>
            </div>
            <div className="h-48 bg-surface-container rounded-xl mb-4 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-on-surface-variant/60 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-medium text-primary shrink-0 mt-0.5">{msg.name}:</span>
                    <span className="text-sm text-on-surface-variant">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendChat} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <Button type="submit" variant="secondary" size="md" disabled={!chatInput.trim()}>Send</Button>
            </form>
          </div>

          {selectedMovie && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2"
            >
              <Button size="lg" className="shadow-2xl" onClick={startWatching}>
                <Icon name="play_arrow" fill={true} /> Start Watching
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

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
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="text-center font-mono uppercase tracking-widest"
              maxLength={6}
            />
            <Button type="submit" variant="secondary" disabled={inputCode.length < 4}>Join</Button>
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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function YouTubePlayer({ videoId, onReady, onStateChange, playerRef }: {
  videoId: string
  onReady: () => void
  onStateChange: (state: number) => void
  playerRef: React.MutableRefObject<any>
}) {
  useEffect(() => {
    if ((window as any).YT?.Player) {
      const player = new (window as any).YT.Player('youtube-player', {
        videoId,
        playerVars: { autoplay: 1, modestbranding: 1, rel: 0, controls: 1 },
        events: {
          onReady: () => { playerRef.current = player; onReady() },
          onStateChange: (e: any) => onStateChange(e.data),
        },
      })
      return () => { player.destroy() }
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.id = 'youtube-iframe-api'
    document.head.appendChild(tag)
    ;(window as any).onYouTubeIframeAPIReady = () => {
      const player = new (window as any).YT.Player('youtube-player', {
        videoId,
        playerVars: { autoplay: 1, modestbranding: 1, rel: 0, controls: 1 },
        events: {
          onReady: () => { playerRef.current = player; onReady() },
          onStateChange: (e: any) => onStateChange(e.data),
        },
      })
    }
    return () => {
      delete (window as any).onYouTubeIframeAPIReady
      const script = document.getElementById('youtube-iframe-api')
      if (script) script.remove()
    }
  }, [videoId, onReady, onStateChange, playerRef])
  return null
}
