import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import FollowButton from '../components/ui/FollowButton'
import GlowGiftButton from '../components/ui/GlowGiftButton'
import { getFollowStats, getFollowers, getFollowing, getFanLeaderboard, getFanStatus } from '../lib/auth'
import { getPublicCreators } from '../lib/api'

function fmt(n: number | undefined): string {
  if (!n) return '0'
  return n.toLocaleString()
}

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [creator, setCreator] = useState<any>(null)
  const [fans, setFans] = useState<any[]>([])
  const [fanStatus, setFanStatus] = useState<any>(null)
  const [listType, setListType] = useState<'followers' | 'following' | null>(null)
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getFollowStats(id), getFanLeaderboard(id), getFanStatus(id), getPublicCreators()])
      .then(([s, f, fs, c]) => {
        if (s.success) setStats(s)
        if (f.success) setFans(f.fans)
        if (fs.success) setFanStatus(fs)
        if (c.success) {
          const match = c.creators.find((x: any) => x.id === id)
          setCreator(match || null)
        }
      })
      .finally(() => setLoading(false))
  }, [id, user])

  const openList = async (type: 'followers' | 'following') => {
    setListType(type)
    const res = type === 'followers' ? await getFollowers(id!) : await getFollowing(id!)
    if (res.success) setList(res.users)
  }

  const closeList = () => {
    setListType(null)
    setList([])
  }

  if (loading) {
    return (
      <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-24 w-24 rounded-2xl bg-white/5 mb-6" />
            <div className="h-6 bg-white/5 rounded w-48 mb-3" />
            <div className="h-4 bg-white/5 rounded w-72 mb-8" />
            <div className="grid grid-cols-2 gap-gutter mb-8">
              <div className="h-24 bg-white/5 rounded-xl" />
              <div className="h-24 bg-white/5 rounded-xl" />
            </div>
            <div className="h-48 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const badge = fanStatus?.badge
  const isCreator = !!creator

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface mb-6 text-sm">
          <Icon name="arrow_back" className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-5 mb-8">
          {stats?.profile?.avatar ? (
            <img src={stats.profile.avatar} alt={stats.profile.name} className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white/10" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-surface-container-high flex items-center justify-center">
              <Icon name="person" className="w-12 h-12 text-on-surface-variant/40" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-headline-md font-bold text-on-surface">{stats?.profile?.name || 'User'}</h1>
              {badge && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: `${badge.color}22`, color: badge.color, border: `1px solid ${badge.color}55` }}
                >
                  <Icon name="workspace_premium" className="w-3.5 h-3.5" /> {badge.tier}
                </span>
              )}
              {isCreator && <span className="px-2 py-0.5 rounded-full bg-primary-container/15 text-primary text-xs font-semibold">Creator</span>}
            </div>
            <p className="text-on-surface-variant text-sm mt-1">{stats?.profile?.bio || 'No bio yet'}</p>
            {user && user.id !== id && (
              <div className="mt-3 flex items-center gap-2">
                <FollowButton creatorId={id!} />
                <GlowGiftButton creatorId={id!} recipientName={stats?.profile?.name} />
              </div>
            )}
          </div>
        </div>

        {/* Follow stats */}
        <div className="grid grid-cols-2 gap-gutter mb-8">
          <button onClick={() => openList('followers')} className="bg-surface-container-high border border-white/5 rounded-xl p-5 text-left hover:border-white/15 transition-colors">
            <Icon name="group" className="text-primary-container mb-3" />
            <p className="text-2xl font-bold text-on-surface">{fmt(stats?.followers)}</p>
            <p className="text-on-surface-variant/60 text-sm">Followers</p>
          </button>
          <button onClick={() => openList('following')} className="bg-surface-container-high border border-white/5 rounded-xl p-5 text-left hover:border-white/15 transition-colors">
            <Icon name="person_add" className="text-secondary mb-3" />
            <p className="text-2xl font-bold text-on-surface">{fmt(stats?.following)}</p>
            <p className="text-on-surface-variant/60 text-sm">Following</p>
          </button>
        </div>

        {/* Creator stats */}
        {isCreator && (
          <div className="grid grid-cols-3 gap-gutter mb-8">
            <div className="bg-surface-container border border-white/5 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-on-surface">{fmt(creator.film_count)}</p>
              <p className="text-on-surface-variant/60 text-xs mt-0.5">Films</p>
            </div>
            <div className="bg-surface-container border border-white/5 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-on-surface">{fmt(creator.total_views)}</p>
              <p className="text-on-surface-variant/60 text-xs mt-0.5">Views</p>
            </div>
            <div className="bg-surface-container border border-white/5 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-on-surface">{fmt(creator.total_likes)}</p>
              <p className="text-on-surface-variant/60 text-xs mt-0.5">Likes</p>
            </div>
          </div>
        )}

        {/* Your fan status */}
        {user && user.id !== id && fanStatus?.engaged && (
          <div className="bg-surface-container border border-white/5 rounded-xl p-5 mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-on-surface-variant">Your fan score on this creator</p>
              <p className="text-lg font-bold text-on-surface mt-1">
                {fanStatus.points} pts {fanStatus.rank ? <span className="text-on-surface-variant text-sm font-normal">· Rank #{fanStatus.rank}</span> : null}
              </p>
            </div>
            <span className="text-2xl" title={badge?.tier}>🏆</span>
          </div>
        )}

        {/* Superfan leaderboard */}
        {isCreator && fans.length > 0 && (
          <div className="mb-8">
            <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-4 flex items-center gap-2">
              <Icon name="leaderboard" className="text-primary-container" /> Superfan Leaderboard
            </h2>
            <div className="space-y-2">
              {fans.slice(0, 10).map((f, i) => (
                <div key={f.user_id} className="flex items-center gap-4 bg-surface-container-high border border-white/5 rounded-xl p-3">
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-on-surface-variant shrink-0">
                    {i + 1}
                  </div>
                  {f.avatar ? (
                    <img src={f.avatar} alt={f.name} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">
                      <Icon name="person" className="w-4 h-4 text-on-surface-variant/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <button onClick={() => navigate(`/profile/${f.user_id}`)} className="font-label-md text-label-md text-on-surface hover:text-primary transition-colors truncate">
                      {f.name}
                    </button>
                    <p className="text-on-surface-variant/60 text-xs">❤ {f.likes} · 💬 {f.comments} · {f.watch_minutes}m watched</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: `${f.badge.color}22`, color: f.badge.color }}>
                    {f.badge.tier}
                  </span>
                  <span className="text-sm font-bold text-on-surface shrink-0 w-10 text-right">{f.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message button */}
        {user && user.id !== id && (
          <button
            onClick={() => navigate(`/chat?with=${id}`)}
            className="w-full py-3 rounded-lg border border-primary/30 text-primary font-label-md hover:bg-primary/10 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Icon name="chat_bubble" className="w-4 h-4" /> Message
          </button>
        )}
      </div>

      {/* Follow list modal */}
      {listType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={closeList}>
          <div className="w-full max-w-md bg-surface-container-high border border-white/10 rounded-2xl p-5 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-label-md text-label-md text-on-surface">{listType === 'followers' ? 'Followers' : 'Following'}</h3>
              <button onClick={closeList} className="text-on-surface-variant hover:text-on-surface"><Icon name="close" /></button>
            </div>
            {list.length === 0 ? (
              <p className="text-on-surface-variant text-sm text-center py-6">No {listType} yet</p>
            ) : (
              <div className="space-y-2">
                {list.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center">
                        <Icon name="person" className="w-4 h-4 text-on-surface-variant/50" />
                      </div>
                    )}
                    <button onClick={() => { closeList(); navigate(`/profile/${u.id}`) }} className="flex-1 text-left font-label-md text-label-md text-on-surface truncate">
                      {u.name}
                    </button>
                    {user && user.id !== u.id && <FollowButton creatorId={u.id} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
