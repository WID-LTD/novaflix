import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { toggleFollow, checkFollow } from '../../lib/auth'

interface FollowButtonProps {
  creatorId: string
  className?: string
  onCountChange?: (count: number, following: boolean) => void
}

export default function FollowButton({ creatorId, className = '', onCountChange }: FollowButtonProps) {
  const { user } = useAuth()
  const [following, setFollowing] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    checkFollow(creatorId).then((r) => {
      if (r.success) {
        setFollowing(r.following)
        setCount(r.count)
      }
    })
  }, [creatorId, user])

  const handleClick = async () => {
    if (!user || loading) return
    setLoading(true)
    const res = await toggleFollow(creatorId)
    if (res.success) {
      setFollowing(res.following)
      setCount(res.count)
      onCountChange?.(res.count, res.following)
    }
    setLoading(false)
  }

  if (!user) return null

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
        following
          ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400'
          : 'bg-primary-container text-on-primary-container hover:brightness-110'
      } ${className}`}
    >
      {following ? 'Following' : 'Follow'}
      {count > 0 && <span className="text-xs opacity-70">({count})</span>}
    </button>
  )
}
