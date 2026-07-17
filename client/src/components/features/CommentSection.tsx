import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Icon from '../ui/Icon'
import { useAuth } from '../../lib/AuthContext'
import { getComments, postComment, deleteComment } from '../../lib/auth'

interface Comment {
  id: string
  user_id: string
  user_name: string
  user_avatar: string | null
  text: string
  created_at: string
}

interface Props {
  contentId: string | number
  contentType: 'movie' | 'tv'
  creatorId?: string
}

export default function CommentSection({ contentId, contentType, creatorId }: Props) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    getComments(String(contentId), contentType).then(r => {
      if (r.success) setComments(r.comments)
      setLoading(false)
    })
  }, [contentId, contentType])

  const handlePost = async () => {
    if (!text.trim() || !user) return
    setSending(true)
    const res = await postComment(String(contentId), contentType, text, creatorId)
    if (res.success) {
      setComments(prev => [res.comment, ...prev])
      setText('')
    }
    setSending(false)
  }

  const handleDelete = async (id: string) => {
    const res = await deleteComment(id)
    if (res.success) {
      setComments(prev => prev.filter(c => c.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon name="chat_bubble" size="sm" />
        <span className="text-sm font-medium">Comments ({comments.length})</span>
      </div>

      {user && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon name="person" size="sm" className="text-accent" />
          </div>
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-surface-secondary border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50"
              onKeyDown={e => e.key === 'Enter' && handlePost()}
            />
            <button
              onClick={handlePost}
              disabled={!text.trim() || sending}
              className="px-3 py-2 bg-accent text-white rounded-xl disabled:opacity-50 hover:bg-red-700 transition-colors"
            >
              <Icon name="send" />
            </button>
          </div>
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
        <p className="text-sm text-gray-500 text-center py-6">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {comments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                {comment.user_avatar ? (
                  <img src={comment.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
            <Icon name="person" size="sm" className="text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{comment.user_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  {user?.id === comment.user_id && (
                    <button onClick={() => handleDelete(comment.id)} className="ml-auto text-gray-500 hover:text-accent transition-colors">
                      <Icon name="delete" size="sm" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-300 mt-0.5">{comment.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
