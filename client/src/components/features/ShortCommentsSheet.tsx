import { useRef, useState, useEffect } from 'react'
import type { ShortComment } from '../../types'
import Icon from '../ui/Icon'
import { useAuth } from '../../lib/AuthContext'

interface ShortCommentsSheetProps {
  open: boolean
  comments: ShortComment[]
  count: number
  onClose: () => void
  onSubmit?: (text: string) => void
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString()
}

export default function ShortCommentsSheet({ open, comments, count, onClose, onSubmit }: ShortCommentsSheetProps) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setTimeout(() => inputRef.current?.focus(), 320)
    }
  }, [open])

  useEffect(() => {
    if (open && comments.length > 0) {
      setTimeout(() => inputRef.current?.focus(), 320)
    }
  }, [comments.length, open])

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit?.(trimmed)
    setText('')
  }

  return (
    <div className={`absolute inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[65vh] bg-neutral-900 rounded-t-2xl transform transition-transform duration-300 flex flex-col ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-label="Comments"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
            aria-label="Close comments"
          >
            <Icon name="expand_more" size="lg" />
          </button>
          <span className="text-sm font-semibold text-white flex items-center gap-1.5">
            <Icon name="chat_bubble" size="sm" />
            {count} comment{count === 1 ? '' : 's'}
          </span>
          <span className="w-10" aria-hidden="true" />
        </div>

        {/* Feed */}
        <div className="overflow-y-auto h-[calc(100%-60px)] px-4 pb-3 no-scrollbar">
          {comments.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-10">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="person" size="sm" className="text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{comment.userName}</span>
                      <span className="text-xs text-neutral-500 shrink-0">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-neutral-300 mt-0.5 break-words leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input tray */}
        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 p-3 flex gap-2">
          <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icon name="person" size="sm" className="text-neutral-300" />
            )}
          </div>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            placeholder="Add a comment..."
            maxLength={300}
            className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 rounded-full px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-[#e50914] text-white hover:brightness-110 active:scale-90 disabled:opacity-40 disabled:pointer-events-none transition-all"
            aria-label="Send comment"
          >
            <Icon name="send" />
          </button>
        </div>
      </div>
    </div>
  )
}
