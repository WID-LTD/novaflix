import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import Icon from '../components/ui/Icon'
import { useStore } from '../store/useStore'
import { useAuth } from '../lib/AuthContext'
import { getMyAchievements, checkAchievements, uploadAvatar, getFollowStats, getFollowers, getFollowing, getGamification } from '../lib/auth'
import Button from '../components/ui/Button'
import PremiumBadge from '../components/ui/PremiumBadge'
import FollowButton from '../components/ui/FollowButton'
import Modal from '../components/ui/Modal'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, isPremium, refresh } = useAuth()
  const watchlist = useStore((s) => s.watchlist)
  const continueWatching = useStore((s) => s.continueWatching)
  const [achievements, setAchievements] = useState<any[]>([])
  const [gamification, setGamification] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [stats, setStats] = useState<{ followers: number; following: number } | null>(null)
  const [activeList, setActiveList] = useState<'followers' | 'following' | null>(null)
  const [listUsers, setListUsers] = useState<any[]>([])
  const [listLoading, setListLoading] = useState(false)

  useEffect(() => {
    (async () => {
      await checkAchievements()
      const res = await getMyAchievements()
      if (res.success) setAchievements(res.data)
      const g = await getGamification()
      if (g.success) setGamification(g.data)
    })()
  }, [])

  useEffect(() => {
    if (!user) return
    getFollowStats(user.id).then((r) => {
      if (r.success) setStats({ followers: r.followers, following: r.following })
    })
  }, [user])

  const openList = async (list: 'followers' | 'following') => {
    if (!user) return
    setActiveList(list)
    setListLoading(true)
    setListUsers([])
    const res = list === 'followers' ? await getFollowers(user.id) : await getFollowing(user.id)
    if (res.success) setListUsers(res.users)
    setListLoading(false)
  }

  const movieCount = watchlist.filter((w) => w.type === 'movie').length
  const tvCount = watchlist.filter((w) => w.type === 'tv').length
  const totalMinutes = continueWatching.reduce((acc, c) => acc + Math.round((c.progress || 0) / 60), 0)
  const avgProgress = continueWatching.length > 0
    ? Math.round(continueWatching.reduce((acc, c) => acc + ((c.progress || 0) / (c.duration || 1)) * 100, 0) / continueWatching.length)
    : 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAvatarClick = () => {
    fileRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const token = localStorage.getItem('novaflix-token') || ''
    const res = await uploadAvatar(token, file)
    setUploading(false)
    if (res.success) {
      refresh()
    }
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-4xl mx-auto">
        {!isPremium && (
          <div className="bg-surface-container-high border border-primary-container/20 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center">
                <Icon name="workspace_premium" fill={true} className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-label-md text-label-md text-on-surface">Upgrade to Premium</h3>
                <p className="text-on-surface-variant/60 text-sm">Unlock 4K, offline downloads, ad-free streaming</p>
              </div>
              <Link to="/pricing">
                <Button size="sm">
                  <Icon name="workspace_premium" fill={true} /> View Plans
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 mb-10">
          <button onClick={handleAvatarClick} disabled={uploading} className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name || ''} className="w-full h-full object-cover" />
            ) : (
              <Icon name="person" className="w-10 h-10" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="flex-1">
            <h1 className="text-headline-lg">{user?.name || 'Guest'}</h1>
            <p className="text-on-surface-variant/60 text-sm mt-1">{user?.email || 'Sign in to sync across devices'}</p>
            {isPremium && (
              <div className="mt-2">
                <PremiumBadge size="sm" />
              </div>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Link to="/settings" className="p-3 rounded-xl hover:bg-white/10 transition-colors text-on-surface-variant" aria-label="Settings">
                <Icon name="settings" />
              </Link>
              <button onClick={handleLogout} className="p-3 rounded-xl hover:bg-white/10 transition-colors text-on-surface-variant" aria-label="Sign out">
                <Icon name="logout" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-10">
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <Icon name="bookmark" className="text-primary-container mb-3" />
            <p className="text-2xl font-bold text-on-surface">{watchlist.length}</p>
            <p className="text-on-surface-variant/60 text-sm">Total Saved</p>
          </div>
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <Icon name="movie" className="text-primary-container mb-3" />
            <p className="text-2xl font-bold text-on-surface">{movieCount}</p>
            <p className="text-on-surface-variant/60 text-sm">Movies</p>
          </div>
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <Icon name="tv" className="text-primary-container mb-3" />
            <p className="text-2xl font-bold text-on-surface">{tvCount}</p>
            <p className="text-on-surface-variant/60 text-sm">TV Shows</p>
          </div>
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5">
            <Icon name="schedule" className="text-secondary mb-3" />
            <p className="text-2xl font-bold text-on-surface">{totalMinutes}</p>
            <p className="text-on-surface-variant/60 text-sm">Minutes Watched</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-gutter mb-10">
          <button
            onClick={() => openList('followers')}
            className="bg-surface-container-high border border-white/5 rounded-xl p-5 text-left hover:border-white/15 transition-colors"
          >
            <Icon name="group" className="text-primary-container mb-3" />
            <p className="text-2xl font-bold text-on-surface">{stats?.followers ?? '–'}</p>
            <p className="text-on-surface-variant/60 text-sm">Followers</p>
          </button>
          <button
            onClick={() => openList('following')}
            className="bg-surface-container-high border border-white/5 rounded-xl p-5 text-left hover:border-white/15 transition-colors"
          >
            <Icon name="person_add" className="text-secondary mb-3" />
            <p className="text-2xl font-bold text-on-surface">{stats?.following ?? '–'}</p>
            <p className="text-on-surface-variant/60 text-sm">Following</p>
          </button>
        </div>

        {continueWatching.length > 0 && (
          <div className="mb-10">
            <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-4">Continue Watching</h2>
            <div className="space-y-2">
              {continueWatching.slice(0, 5).map((item) => (
                <div
                  key={`${item.id}-${item.type}`}
                  className="flex items-center gap-4 bg-surface-container-high border border-white/5 rounded-xl p-4"
                >
                  <div className="w-12 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0">
                    {item.poster && (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-label-md text-on-surface truncate">{item.title}</p>
                    <p className="text-on-surface-variant/60 text-sm">
                      {item.type === 'tv' && item.season
                        ? `S${item.season} E${item.episode}`
                        : 'Movie'}
                    </p>
                    <div className="w-full h-1 bg-surface-container rounded-full mt-2">
                      <div
                        className="h-full bg-primary-container rounded-full"
                        style={{
                          width: `${item.duration > 0 ? (item.progress / item.duration) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      (window.location.href = `/watch?id=${item.id}&type=${item.type}${item.season ? `&season=${item.season}&episode=${item.episode}` : ''}`)
                    }
                  >
                    Resume
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {gamification && (
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center">
                  <span className="font-display text-headline-md text-primary-container">Lv {gamification.level}</span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">Level {gamification.level}</p>
                  <p className="text-on-surface font-label-md text-label-md">{gamification.xp} XP earned</p>
                </div>
              </div>
              <p className="text-on-surface-variant text-sm">
                <span className="text-primary-container font-semibold">{gamification.unlockedCount}</span> / {gamification.totalCount} achievements unlocked
              </p>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-700"
                style={{ width: `${gamification.progressPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-on-surface-variant/60">
              {gamification.nextLevelXp > 0
                ? `${gamification.currentLevelXp} / ${gamification.nextLevelXp} XP to next level`
                : 'Max level reached'}
            </p>
          </div>
        )}

        <div className="mb-10">
          <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-4 flex items-center gap-2">
            <Icon name="emoji_events" className="text-primary-container" /> Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map((a) => {
              const earned = !!a.earned_at
              return (
                <div
                  key={a.key}
                  className={`bg-surface-container-high border rounded-xl p-4 text-center ${
                    earned ? 'border-primary-container/30' : 'border-white/5 opacity-40'
                  }`}
                >
                  <Icon name={a.icon || 'emoji_events'} className="mx-auto mb-2 text-on-surface-variant" />
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{a.name}</p>
                  <p className="text-on-surface-variant/40 text-sm">{a.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-surface-container-high border border-white/5 rounded-xl p-6 mb-6">
          <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link to="/settings" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Icon name="settings" className="text-on-surface-variant" />
                <span className="font-label-md text-label-md text-on-surface">Settings</span>
              </div>
              <Icon name="chevron_right" className="text-on-surface-variant/40" />
            </Link>
            <Link to="/pricing" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Icon name="workspace_premium" className="text-primary-container" />
                <span className="font-label-md text-label-md text-on-surface">Premium Plans</span>
              </div>
              <Icon name="chevron_right" className="text-on-surface-variant/40" />
            </Link>
          </div>
        </div>
      </div>

      <Modal
        isOpen={activeList !== null}
        onClose={() => setActiveList(null)}
        title={activeList === 'followers' ? 'Followers' : 'Following'}
      >
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {listLoading ? (
            <div className="py-8 text-center text-on-surface-variant/60 text-sm">Loading...</div>
          ) : listUsers.length === 0 ? (
            <div className="py-8 text-center text-on-surface-variant/60 text-sm">
              {activeList === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </div>
          ) : (
            listUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-card border border-white/5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center shrink-0">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="person" size="sm" className="text-on-surface-variant/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{u.name || 'Anonymous'}</p>
                </div>
                {u.id !== user?.id && <FollowButton creatorId={u.id} />}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
