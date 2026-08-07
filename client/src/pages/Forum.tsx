import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getForumTopics, getForumTopic, createForumTopic, voteForumTopic,
  addForumReply, voteForumReply, getForumCategories,
} from '../lib/auth'

interface Topic {
  id: string
  title: string
  content: string
  category: string
  author_id: string
  author_name: string
  author_avatar: string | null
  upvotes: number
  downvotes: number
  reply_count: number
  myVote: number
  created_at: string
}

interface Reply {
  id: string
  author_id: string
  author_name: string
  author_avatar: string | null
  content: string
  parent_id: string | null
  upvotes: number
  downvotes: number
  myVote: number
  created_at: string
}

const PAGE_SIZE = 15
const MAX_INDENT = 6

function ReplyNode({ reply, allReplies, depth, user, onVote, onReply }: {
  reply: Reply
  allReplies: Reply[]
  depth: number
  user: { id: string } | null
  onVote: (r: Reply, dir: 1 | -1) => void
  onReply: (r: Reply) => void
}) {
  const children = allReplies.filter(r => r.parent_id === reply.id)
  return (
    <div className="relative">
      <div className="relative">
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
        )}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-high border border-white/5 rounded-xl p-4"
          style={{ marginLeft: `${Math.min(depth, MAX_INDENT) * 1.5}rem` }}
        >
          <div className="flex items-center gap-2 mb-2">
            {reply.author_avatar ? (
              <img src={reply.author_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <Icon name="person" className="w-4 h-4 text-on-surface-variant/50" />
            )}
            <span className="text-sm font-medium text-on-surface-variant">{reply.author_name}</span>
            <span className="text-xs text-on-surface-variant/50">{new Date(reply.created_at).toLocaleDateString()}</span>
            {depth > 0 && <span className="text-[10px] text-on-surface-variant/50">↳ reply</span>}
          </div>
          <p className="text-sm text-on-surface whitespace-pre-wrap">{reply.content}</p>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => onVote(reply, 1)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors ${reply.myVote === 1 ? 'bg-green-500/15 border-green-500 text-green-400' : 'border-white/10 text-on-surface-variant hover:text-green-400'}`}>
              <Icon name="thumb_up" className="w-3.5 h-3.5" /> {reply.upvotes}
            </button>
            <button onClick={() => onVote(reply, -1)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors ${reply.myVote === -1 ? 'bg-red-500/15 border-red-500 text-red-400' : 'border-white/10 text-on-surface-variant hover:text-red-400'}`}>
              <Icon name="thumb_down" className="w-3.5 h-3.5" /> {reply.downvotes}
            </button>
            <span className="text-xs text-on-surface-variant/60">{(reply.upvotes || 0) - (reply.downvotes || 0)}</span>
            {user && (
              <button onClick={() => onReply(reply)} className="text-xs text-on-surface-variant hover:text-primary px-2 py-1">
                Reply
              </button>
            )}
          </div>
        </motion.div>
      </div>
      {children.map(c => (
        <ReplyNode key={c.id} reply={c} allReplies={allReplies} depth={depth + 1} user={user} onVote={onVote} onReply={onReply} />
      ))}
    </div>
  )
}

export default function Forum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const params = useParams<{ topicId: string }>()

  const [categories, setCategories] = useState<string[]>(['all'])
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<'new' | 'hot'>('new')
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [creating, setCreating] = useState(false)

  // Thread view
  const topicId = params.topicId
  const [topic, setTopic] = useState<Topic | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [threadLoading, setThreadLoading] = useState(false)

  const topicsRef = useRef<Topic[]>([])
  useEffect(() => { topicsRef.current = topics }, [topics])
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const loadTopics = useCallback((cat: string, s: string, reset: boolean) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)
    const offset = reset ? 0 : topicsRef.current.length
    getForumTopics(cat, PAGE_SIZE, offset, s).then(r => {
      if (r.success) {
        setTopics(prev => reset
          ? r.topics
          : [...prev, ...r.topics.filter((t: Topic) => !prev.some(p => p.id === t.id))])
        setHasMore(r.topics.length === PAGE_SIZE)
      }
      setLoading(false)
      setLoadingMore(false)
    })
  }, [])

  useEffect(() => {
    getForumCategories().then(r => {
      if (r.success && r.categories.length) setCategories(['all', ...r.categories])
    })
  }, [])

  useEffect(() => { loadTopics(category, sort, true) }, [category, sort, loadTopics])

  // Infinite scroll for topic list
  useEffect(() => {
    if (topicId) return
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        loadTopics(category, sort, false)
      }
    }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [topicId, hasMore, loading, loadingMore, category, sort, loadTopics])

  const loadThread = useCallback(() => {
    if (!topicId) return
    setThreadLoading(true)
    getForumTopic(topicId).then(r => {
      if (r.success) {
        setTopic(r.topic)
        setReplies(r.replies)
      }
      setThreadLoading(false)
    })
  }, [topicId])

  useEffect(() => { loadThread() }, [loadThread])

  // Realtime replies via WebSocket
  useEffect(() => {
    if (!topicId || !user) return
    const token = localStorage.getItem('novaflix-token') || ''
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws?token=${encodeURIComponent(token)}`)
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'topic-join', payload: { topicId } }))
    }
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'topic-reply' && msg.topicId === topicId) {
          setReplies(prev => prev.some(r => r.id === msg.reply.id)
            ? prev
            : [...prev, { ...msg.reply, myVote: msg.reply.myVote ?? 0 }])
          setTopic(t => t ? { ...t, reply_count: (t.reply_count || 0) + 1 } : t)
        }
      } catch {}
    }
    ws.onclose = () => { wsRef.current = null }
    wsRef.current = ws
    return () => { ws.close(); wsRef.current = null }
  }, [topicId, user])

  const createTopic = async () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setCreating(true)
    const res = await createForumTopic(newTitle.trim(), newCategory, newContent.trim())
    setCreating(false)
    if (res.success) {
      setShowNew(false)
      setNewTitle('')
      setNewContent('')
      navigate(`/forum/${res.topic.id}`)
    }
  }

  const vote = async (t: Topic, dir: 1 | -1) => {
    if (!user) return navigate('/login')
    const next = t.myVote === dir ? 0 : dir
    const res = await voteForumTopic(t.id, next)
    if (res.success) {
      setTopics(prev => prev.map(x => x.id === t.id ? { ...x, myVote: next, upvotes: res.upvotes, downvotes: res.downvotes } : x))
    }
  }

  const voteReply = async (r: Reply, dir: 1 | -1) => {
    if (!user) return navigate('/login')
    const next = r.myVote === dir ? 0 : dir
    const res = await voteForumReply(r.id, next)
    if (res.success) {
      setReplies(prev => prev.map(x => x.id === r.id ? { ...x, myVote: next, upvotes: res.upvotes, downvotes: res.downvotes } : x))
    }
  }

  const postReply = async () => {
    if (!replyText.trim() || !topicId) return
    const res = await addForumReply(topicId, replyText.trim(), replyingTo || undefined)
    if (res.success) {
      setReplyText('')
      setReplyingTo(null)
      setReplies(prev => prev.some(x => x.id === res.reply.id)
        ? prev
        : [...prev, { ...res.reply, myVote: res.reply.myVote ?? 0 }])
      setTopic(t => t ? { ...t, reply_count: (t.reply_count || 0) + 1 } : t)
    }
  }

  // Thread view
  if (topicId) {
    const roots = replies.filter(r => !r.parent_id)
    return (
      <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/forum')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface mb-4 text-sm">
            <Icon name="arrow_back" className="w-4 h-4" /> Back to hot takes
          </button>
          {threadLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}</div>
          ) : topic ? (
            <>
              <div className="bg-surface-container-high border border-white/5 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold uppercase">{topic.category}</span>
                  <span className="text-xs text-on-surface-variant/60">{new Date(topic.created_at).toLocaleDateString()}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-on-surface-variant/60">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Live
                  </span>
                </div>
                <h1 className="text-headline-sm font-bold text-on-surface mb-2">{topic.title}</h1>
                <div className="flex items-center gap-2 mb-4">
                  {topic.author_avatar ? (
                    <img src={topic.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <Icon name="person" className="text-on-surface-variant/50" />
                  )}
                  <button onClick={() => navigate(`/profile/${topic.author_id}`)} className="text-sm font-medium text-on-surface-variant hover:text-primary">{topic.author_name}</button>
                </div>
                <p className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap">{topic.content}</p>
                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => vote(topic, 1)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${topic.myVote === 1 ? 'bg-green-500/15 border-green-500 text-green-400' : 'border-white/10 text-on-surface-variant hover:text-green-400'}`}>
                    <Icon name="thumb_up" className="w-4 h-4" /> {topic.upvotes}
                  </button>
                  <button onClick={() => vote(topic, -1)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${topic.myVote === -1 ? 'bg-red-500/15 border-red-500 text-red-400' : 'border-white/10 text-on-surface-variant hover:text-red-400'}`}>
                    <Icon name="thumb_down" className="w-4 h-4" /> {topic.downvotes}
                  </button>
                  <span className="text-xs text-on-surface-variant/60 ml-2">💬 {replies.length} replies</span>
                </div>
              </div>

              <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-4">Replies ({replies.length})</h2>
              <div className="space-y-3 mb-6">
                {replies.length === 0 && <p className="text-on-surface-variant text-sm text-center py-6">No replies yet. Drop a hot take!</p>}
                {roots.map(r => (
                  <ReplyNode key={r.id} reply={r} allReplies={replies} depth={0} user={user} onVote={voteReply} onReply={(rr) => setReplyingTo(replyingTo === rr.id ? null : rr.id)} />
                ))}
              </div>

              {user ? (
                <div className="bg-surface-container-high border border-white/5 rounded-xl p-4">
                  {replyingTo && <p className="text-xs text-on-surface-variant mb-2">Replying to a comment <button onClick={() => setReplyingTo(null)} className="text-primary">(cancel)</button></p>}
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Share your hot take…"
                    className="w-full bg-surface-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 resize-none"
                  />
                  <button onClick={postReply} disabled={!replyText.trim()} className="mt-2 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-label-md hover:brightness-110 transition-all disabled:opacity-40">
                    Post reply
                  </button>
                </div>
              ) : (
                <p className="text-center text-on-surface-variant text-sm">Sign in to join the discussion</p>
              )}
            </>
          ) : (
            <p className="text-on-surface-variant text-center py-12">Topic not found.</p>
          )}
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/community')} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface mb-4 text-sm">
          <Icon name="arrow_back" className="w-4 h-4" /> Community Hub
        </button>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Icon name="forum" className="text-primary-container" />
            <h1 className="text-headline-md font-bold text-on-surface">Hot Takes · Debate Forum</h1>
          </div>
          {user && (
            <button onClick={() => setShowNew(v => !v)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-md hover:brightness-110 transition-all">
              <Icon name="add" className="w-4 h-4" /> New hot take
            </button>
          )}
        </div>
        <p className="text-on-surface-variant text-sm mb-4">Controversial movie opinions — change my mind.</p>

        <button onClick={() => navigate('/community')} className="w-full mb-5 flex items-center justify-between bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-left hover:border-primary-container/20 transition-colors group">
          <span className="flex items-center gap-2 text-sm font-medium text-on-surface">
            <Icon name="diversity_3" className="text-primary-container" /> Browse Communities →
          </span>
          <Icon name="arrow_forward" className="w-4 h-4 text-on-surface-variant/50 group-hover:text-primary transition-colors" />
        </button>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex gap-1 bg-surface-container-high rounded-xl p-1 border border-white/5">
            <button onClick={() => setSort('hot')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sort === 'hot' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>
              Hot
            </button>
            <button onClick={() => setSort('new')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sort === 'new' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>
              New
            </button>
          </div>
          <div className="flex gap-1 flex-1 overflow-x-auto bg-surface-container-high rounded-xl p-1 border border-white/5">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === c ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {showNew && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-high border border-white/5 rounded-xl p-4 mb-6 space-y-3">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Unpopular opinion: …"
              className="w-full bg-surface-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={4}
              placeholder="Explain your take…"
              className="w-full bg-surface-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 resize-none"
            />
            <div className="flex gap-2">
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="bg-surface-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              >
                {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                {!categories.includes('general') && <option value="general">General</option>}
              </select>
              <button onClick={createTopic} disabled={creating || !newTitle.trim() || !newContent.trim()} className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-label-md hover:brightness-110 transition-all disabled:opacity-40">
                Post
              </button>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : topics.length === 0 ? (
          <p className="text-center text-on-surface-variant py-12">No hot takes yet in this category. Start one!</p>
        ) : (
          <div className="space-y-3">
            {topics.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="bg-surface-container-high border border-white/5 rounded-xl p-4 hover:border-white/15 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button onClick={() => vote(t, 1)} className={`p-1 rounded-md transition-colors ${t.myVote === 1 ? 'text-green-400' : 'text-on-surface-variant/60 hover:text-green-400'}`}>
                      <Icon name="thumb_up" className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold text-on-surface-variant w-6 text-center">{t.upvotes - t.downvotes}</span>
                    <button onClick={() => vote(t, -1)} className={`p-1 rounded-md transition-colors ${t.myVote === -1 ? 'text-red-400' : 'text-on-surface-variant/60 hover:text-red-400'}`}>
                      <Icon name="thumb_down" className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => navigate(`/forum/${t.id}`)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold uppercase">{t.category}</span>
                      <span className="text-xs text-on-surface-variant/50">{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-label-md text-label-md text-on-surface truncate">{t.title}</h3>
                    <p className="text-sm text-on-surface-variant/70 line-clamp-2 mt-1">{t.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {t.author_avatar ? <img src={t.author_avatar} alt="" className="w-5 h-5 rounded-full object-cover" /> : <Icon name="person" className="w-4 h-4 text-on-surface-variant/50" />}
                      <span className="text-xs text-on-surface-variant/70">{t.author_name}</span>
                      <span className="text-xs text-on-surface-variant/50 ml-auto">💬 {t.reply_count}</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="py-6 text-center">
          {loadingMore ? (
            <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : !hasMore && topics.length > 0 ? (
            <span className="text-xs text-on-surface-variant/50">You've reached the end</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
