import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Icon from '../ui/Icon'
import { useAuth } from '../../lib/AuthContext'
import { toggleLike, checkLike } from '../../lib/auth'
import { subscribeContent } from '../../lib/live'

interface Props {
  contentId: string | number
  contentType: 'movie' | 'tv'
  creatorId?: string
  className?: string
}

export default function LikeButton({ contentId, contentType, creatorId, className = '' }: Props) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!user) return
    checkLike(String(contentId), contentType).then(r => {
      if (r.success) {
        setLiked(r.liked)
        setCount(r.count)
      }
    })
  }, [contentId, contentType, user])

  useEffect(() => {
    return subscribeContent(contentType, String(contentId), (msg) => {
      if (msg.type === 'like' && typeof msg.count === 'number') {
        setCount(msg.count)
      }
    })
  }, [contentId, contentType])

  const handleToggle = async () => {
    if (!user) return
    setAnimating(true)
    const res = await toggleLike(String(contentId), contentType, creatorId)
    if (res.success) {
      setLiked(res.liked)
      setCount(res.count)
    }
    setTimeout(() => setAnimating(false), 300)
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 transition-colors ${
        liked ? 'text-accent' : 'text-gray-400 hover:text-accent'
      } ${className}`}
    >
      <motion.div
        animate={animating ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Icon name="favorite" fill={liked} className={`w-5 h-5 ${liked ? 'text-accent' : ''}`} />
      </motion.div>
      <span className="text-sm">{count || ''}</span>
    </button>
  )
}
