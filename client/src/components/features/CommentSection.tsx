import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Icon from '../ui/Icon'
import { useAuth } from '../../lib/AuthContext'
import { getComments, deleteComment, postCommentFull, uploadCommentMedia } from '../../lib/auth'
import { subscribeContent } from '../../lib/live'

interface Comment {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  text: string | null
  media_url: string | null
  media_type: string | null
  duration_seconds: number | null
  unlock_at: string | null
  milestone_unlock: string | null
  unlockMilestone?: string | null
  locked: boolean
  created_at: string
}

interface Props {
  contentId: string | number
  contentType: 'movie' | 'tv'
  creatorId?: string
}

const MILESTONES = [
  { value: '100_likes', label: '100 likes' },
  { value: '500_likes', label: '500 likes' },
  { value: '1k_likes', label: '1k likes' },
  { value: '1k_followers', label: '1k followers' },
  { value: '10k_followers', label: '10k followers' },
]

export default function CommentSection({ contentId, contentType, creatorId }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [attachment, setAttachment] = useState<{ file: File; url: string; type: string } | null>(null)
  const [unlockAt, setUnlockAt] = useState('')
  const [milestone, setMilestone] = useState('')
  const [showCapsule, setShowCapsule] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    getComments(String(contentId), contentType).then(r => {
      if (r.success) {
        setComments(r.comments)
        if (typeof r.total === 'number') setTotal(r.total)
      }
      setLoading(false)
    })
  }, [contentId, contentType])

  useEffect(() => {
    return subscribeContent(contentType, String(contentId), (msg) => {
      if (msg.type === 'comment' && msg.comment) {
        setComments(prev => {
          if (prev.some(c => c.id === msg.comment.id)) return prev
          return [msg.comment, ...prev]
        })
        setTotal(t => t + 1)
      }
    })
  }, [contentId, contentType])

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const isAudio = f.type.startsWith('audio/')
    const isVideo = f.type.startsWith('video/')
    if (!isAudio && !isVideo) return
    setAttachment({ file: f, url: URL.createObjectURL(f), type: isAudio ? 'audio' : 'video' })
  }

  const handlePost = async () => {
    if (!user) return
    if (!text.trim() && !attachment) return
    setSending(true)

    let mediaUrl: string | undefined
    let mediaType: string | undefined
    let durationSeconds: number | undefined

    if (attachment) {
      const up = await uploadCommentMedia(attachment.file)
      if (up.success) {
        mediaUrl = up.url
        mediaType = attachment.type
        durationSeconds = up.durationSeconds
      }
    }

    const res = await postCommentFull({
      contentId: String(contentId),
      contentType,
      text: text.trim() || undefined,
      creatorId,
      mediaUrl,
      mediaType,
      durationSeconds,
      unlockAt: unlockAt ? new Date(unlockAt).toISOString() : undefined,
      milestoneUnlock: milestone || undefined,
    })

    if (res.success) {
      setComments(prev => [res.comment, ...prev])
      setTotal(t => t + 1)
      setText('')
      setUnlockAt('')
      setMilestone('')
      setShowCapsule(false)
      setAttachment(null)
    }
    setSending(false)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteComment(id)
    if (res.success) {
      setComments(prev => prev.filter(c => c.id !== id))
      setTotal(t => Math.max(0, t - 1))
    }
  }

  const renderMedia = (c: Comment) => {
    if (c.locked || !c.media_url) return null
    if (c.media_type === 'video') {
      return (
        <video src={c.media_url} controls preload="metadata" className="mt-2 rounded-lg w-full max-w-xs bg-black" />
      )
    }
    if (c.media_type === 'audio') {
      return (
        <audio src={c.media_url} controls preload="metadata" className="mt-2 w-full max-w-xs" />
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <Icon name="chat_bubble" size="sm" />
        <span className="text-sm font-medium">Comments ({total || comments.length})</span>
      </div>

      {user && (
        <div className="space-y-2">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0">
              <Icon name="person" size="sm" className="text-primary-container" />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-surface-container-high border border-white/10 rounded-xl px-4 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50"
                onKeyDown={e => e.key === 'Enter' && handlePost()}
              />
              <button
                onClick={() => fileRef.current?.click()}
                title="Add video or voice comment"
                className={`px-3 py-2 rounded-xl border transition-colors ${attachment ? 'bg-primary-container/20 border-primary-container/50 text-primary-container' : 'border-white/10 text-on-surface-variant hover:text-primary-container'}`}
              >
                <Icon name={attachment?.type === 'audio' ? 'mic' : 'videocam'} />
              </button>
              <button
                onClick={() => setShowCapsule(v => !v)}
                title="Time capsule (schedule unlock)"
                className={`px-3 py-2 rounded-xl border transition-colors ${showCapsule ? 'bg-primary-container/20 border-primary-container/50 text-primary-container' : 'border-white/10 text-on-surface-variant hover:text-primary-container'}`}
              >
                <Icon name="schedule" />
              </button>
              <button
                onClick={handlePost}
                disabled={(!text.trim() && !attachment) || sending}
                className="px-3 py-2 bg-primary-container text-on-surface rounded-xl disabled:opacity-50 hover:brightness-110 transition-colors"
              >
                <Icon name="send" />
              </button>
              <input ref={fileRef} type="file" accept="video/*,audio/*" className="hidden" onChange={pickFile} />
            </div>
          </div>

          {attachment && (
            <div className="flex items-center gap-3 ml-11 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              {attachment.type === 'audio' ? (
                <audio src={attachment.url} controls className="h-9 flex-1" />
              ) : (
                <video src={attachment.url} controls className="h-16 rounded-lg flex-1" />
              )}
              <button onClick={() => setAttachment(null)} className="text-on-surface-variant hover:text-primary-container">
                <Icon name="close" size="sm" />
              </button>
            </div>
          )}

          {showCapsule && (
            <div className="ml-11 bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
              <div>
                <p className="text-xs text-on-surface-variant mb-1">Unlock at date (optional)</p>
                <input
                  type="datetime-local"
                  value={unlockAt}
                  onChange={e => setUnlockAt(e.target.value)}
                  className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                />
              </div>
              <div>
                <p className="text-xs text-on-surface-variant mb-1">Or unlock when milestone is reached (optional)</p>
                <select
                  value={milestone}
                  onChange={e => setMilestone(e.target.value)}
                  className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-container/50"
                >
                  <option value="">No milestone</option>
                  {MILESTONES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <p className="text-xs text-on-surface-variant/70">
                {unlockAt || milestone
                  ? 'This comment stays hidden until the selected time or milestone is reached. You can always see your own.'
                  : 'A time capsule comment is hidden until a date or milestone unlocks it.'}
              </p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-24" />
                <div className="h-4 bg-white/5 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-on-surface-variant/70 text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {comments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center shrink-0 overflow-hidden">
                {comment.user_avatar ? (
                  <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="person" size="sm" className="text-primary-container" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-on-surface">{comment.user_name}</span>
                  <span className="text-xs text-on-surface-variant/70">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {comment.media_type && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-on-surface-variant">
                      {comment.media_type === 'audio' ? 'voice' : 'video'}
                    </span>
                  )}
                  {comment.locked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 inline-flex items-center gap-1">
                      <Icon name="lock" size="sm" /> Time capsule · {comment.unlockMilestone || 'unlocks later'}
                    </span>
                  )}
                  {user?.id === comment.user_id && (
                    <button onClick={() => handleDelete(comment.id)} className="ml-auto text-on-surface-variant/70 hover:text-primary-container transition-colors">
                      <Icon name="delete" size="sm" />
                    </button>
                  )}
                </div>
                {comment.locked ? (
                  <p className="text-sm text-on-surface-variant/70 mt-0.5 italic">🔒 Hidden until the unlock condition is met.</p>
                ) : (
                  <>
                    {comment.text && <p className="text-sm text-on-surface-variant mt-0.5 break-words">{comment.text}</p>}
                    {renderMedia(comment)}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
