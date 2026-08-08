import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getSecretRoom } from '../lib/auth'
import { WS_ORIGIN } from '../lib/config'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'

interface ChatMsg {
  userId: string
  name: string
  message: string
  timestamp: number
}

export default function SecretRoom() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [connected, setConnected] = useState<string[]>([])
  const [chatInput, setChatInput] = useState('')
  const [online, setOnline] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('novaflix-token') || ''
    if (!token) {
      navigate('/login?redirect=/community')
      return
    }
    getSecretRoom(token, id || '').then((res) => {
      setLoading(false)
      if (res.success && res.room) {
        setRoom(res.room)
      } else {
        setLocked(true)
      }
    }).catch(() => { setLoading(false); setLocked(true) })
  }, [id, navigate])

  useEffect(() => {
    if (!room) return
    const token = localStorage.getItem('novaflix-token') || ''
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = WS_ORIGIN ? new URL(WS_ORIGIN).host : window.location.host
    const roomCode = `secret:${room.id}`
    const ws = new WebSocket(`${protocol}//${host}/ws?token=${encodeURIComponent(token)}`)

    ws.onopen = () => {
      setOnline(true)
      ws.send(JSON.stringify({ type: 'join', room: roomCode }))
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        switch (msg.type) {
          case 'joined':
            setConnected(msg.users || [])
            break
          case 'chat-history':
            setMessages(msg.messages || [])
            break
          case 'user-joined':
            setConnected((prev) => (prev.includes(msg.userId) ? prev : [...prev, msg.userId]))
            break
          case 'user-left':
            setConnected((prev) => prev.filter((uid) => uid !== msg.userId))
            break
          case 'chat':
            setMessages((prev) => [...prev, {
              userId: msg.userId,
              name: msg.name || 'Anonymous',
              message: msg.message,
              timestamp: msg.timestamp,
            }])
            break
          case 'error':
            setOnline(false)
            break
        }
      } catch {}
    }
    ws.onclose = () => { setOnline(false); if (wsRef.current === ws) wsRef.current = null }
    wsRef.current = ws

    return () => {
      wsRef.current = null
      ws.close()
    }
  }, [room])

  const sendMessage = () => {
    const text = chatInput.trim()
    if (!text || !wsRef.current || wsRef.current.readyState !== 1) return
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      room: `secret:${room.id}`,
      payload: { message: text },
    }))
    setChatInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 pb-16">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface mb-4"
        >
          <Icon name="arrow_back" size="sm" /> Back to Community
        </button>

        {loading ? (
          <Skeleton variant="hero" className="w-full h-56 rounded-2xl" />
        ) : locked ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-container-high rounded-2xl border border-white/10 p-10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Icon name="lock" className="text-4xl text-primary" />
            </div>
            <h1 className="text-headline-md font-bold mb-2">This room is sealed</h1>
            <p className="text-on-surface-variant text-sm mb-6 max-w-md mx-auto">
              A hidden digital key unlocks this room. Pause the right film at the right moment and collect it to gain entry.
            </p>
            <Button variant="secondary" onClick={() => navigate('/')}>
              Go Hunting <Icon name="arrow_forward" size="sm" />
            </Button>
          </motion.div>
        ) : room ? (
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-container-high rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="p-6 md:p-8 border-b border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold uppercase flex items-center gap-1">
                  <Icon name="vpn_key" className="w-3 h-3" /> Secret Room
                </span>
                {online && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {connected.length} inside
                  </span>
                )}
              </div>
              <h1 className="text-headline-md font-bold mb-2">{room.name}</h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {room.description || 'You found your way in. Welcome.'}
              </p>
              {room.contentId && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate(`/watch?id=${encodeURIComponent(room.contentId)}&type=movie`)}
                >
                  <Icon name="play_arrow" size="sm" /> Return to the Scene
                </Button>
              )}
            </div>

            <div className="p-4 md:p-6">
              <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2">
                <Icon name="forum" size="sm" className="text-primary-container" /> Room Chat
              </h2>
              <div className="bg-surface-container rounded-xl border border-white/5 p-4 h-72 overflow-y-auto mb-3 space-y-2">
                {messages.length === 0 ? (
                  <p className="text-on-surface-variant/50 text-sm text-center pt-20">
                    Only those who found the key can see this. Say hello.
                  </p>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-on-surface-variant/70">
                          <span className="text-primary font-medium mr-2">{m.name}</span>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm text-on-surface break-words">{m.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                  placeholder={online ? 'Message the room…' : 'Connecting…'}
                  disabled={!online}
                  className="flex-1 bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50"
                />
                <Button onClick={sendMessage} disabled={!online || !chatInput.trim()}>
                  <Icon name="send" size="sm" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
