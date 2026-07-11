import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, Copy, Play, MessageCircle, Share2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'

const demoMovies = [
  { id: 1, title: 'Inception', year: '2010' },
  { id: 2, title: 'Interstellar', year: '2014' },
  { id: 3, title: 'The Dark Knight', year: '2008' },
]

interface ChatMsg {
  userId: string
  name: string
  message: string
  timestamp: number
}

export default function WatchParty() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const wsRef = useRef<WebSocket | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [joined, setJoined] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null)
  const [users, setUsers] = useState<string[]>([])
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [inputCode, setInputCode] = useState('')

  const connect = useCallback((code: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws`)

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
        }
      } catch {}
    }

    ws.onclose = () => {
      wsRef.current = null
    }

    wsRef.current = ws
  }, [user])

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'leave' }))
        wsRef.current.close()
      }
    }
  }, [])

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

  if (joined) {
    return (
      <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Watch Party</h1>
              <p className="text-sm text-gray-400 mt-1">
                Room: <span className="text-creator font-mono font-bold">{roomCode}</span>
                <span className="ml-3 text-gray-600">({users.length} connected)</span>
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={copyLink}>
              <Copy className="w-4 h-4" /> Invite
            </Button>
          </div>

          <div className="bg-surface-card border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Choose a Movie</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {demoMovies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedMovie === movie.id
                      ? 'border-creator bg-creator/10'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="aspect-[2/3] bg-surface-secondary rounded-lg mb-3 flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-white truncate">{movie.title}</p>
                  <p className="text-xs text-gray-500">{movie.year}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-creator" />
              <h2 className="text-lg font-semibold text-white">Party Chat</h2>
              <span className="text-xs text-gray-500 ml-auto">{messages.length} messages</span>
            </div>
            <div className="h-48 bg-surface rounded-xl mb-4 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-medium text-creator shrink-0 mt-0.5">{msg.name}:</span>
                    <span className="text-sm text-gray-300">{msg.message}</span>
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
              <Button type="submit" variant="secondary" size="md" disabled={!chatInput.trim()}>
                Send
              </Button>
            </form>
          </div>

          {selectedMovie && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2"
            >
              <Button size="lg" className="shadow-2xl">
                <Play className="w-5 h-5 fill-current" /> Start Watching
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-20 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-creator/10 mb-4">
            <Users className="w-8 h-8 text-creator" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Watch <span className="text-creator">Together</span>
          </h1>
          <p className="text-gray-400">Sync playback and chat with friends in real-time</p>
        </div>

        <div className="bg-surface-card border border-white/10 rounded-2xl p-8 mb-6">
          <Button size="lg" className="w-full mb-6" onClick={createRoom}>
            <Users className="w-5 h-5" /> Create a Room
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-card px-2 text-gray-500">or join existing</span>
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
            <Button type="submit" variant="secondary" disabled={inputCode.length < 4}>
              Join
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
          <div><Play className="w-5 h-5 mx-auto mb-1 text-premium" /><p>Sync Playback</p></div>
          <div><MessageCircle className="w-5 h-5 mx-auto mb-1 text-info" /><p>Live Chat</p></div>
          <div><Share2 className="w-5 h-5 mx-auto mb-1 text-success" /><p>Invite Friends</p></div>
        </div>
      </div>
    </div>
  )
}
