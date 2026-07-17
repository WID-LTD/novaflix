import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useStore } from '../store/useStore'
import { useAuth } from '../lib/AuthContext'
import Button from '../components/ui/Button'
import PremiumBadge from '../components/ui/PremiumBadge'

const badges = [
  { icon: 'star' as const, label: 'Film Buff', desc: 'Watch 10+ films', earned: false },
  { icon: 'trending_up' as const, label: 'Trend Setter', desc: 'Add 5 to watchlist', earned: false },
  { icon: 'schedule' as const, label: 'Night Owl', desc: 'Watch after midnight', earned: false },
  { icon: 'emoji_events' as const, label: 'Explorer', desc: 'Visit 5 genres', earned: false },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, isPremium } = useAuth()
  const watchlist = useStore((s) => s.watchlist)
  const continueWatching = useStore((s) => s.continueWatching)

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
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center">
            <Icon name="person" className="w-10 h-10" />
          </div>
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
            <button onClick={handleLogout} className="p-3 rounded-xl hover:bg-white/10 transition-colors text-on-surface-variant" aria-label="Sign out">
              <Icon name="logout" />
            </button>
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

        <div className="mb-10">
          <h2 className="font-label-md text-label-md text-on-surface uppercase tracking-widest mb-4 flex items-center gap-2">
            <Icon name="emoji_events" className="text-primary-container" /> Achievements
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((b) => (
              <div
                key={b.label}
                className={`bg-surface-container-high border rounded-xl p-4 text-center ${
                  b.earned ? 'border-primary-container/30' : 'border-white/5 opacity-40'
                }`}
              >
                <Icon name={b.icon} className="mx-auto mb-2 text-on-surface-variant" />
                <p className="font-label-sm text-label-sm text-on-surface-variant">{b.label}</p>
                <p className="text-on-surface-variant/40 text-sm">{b.desc}</p>
              </div>
            ))}
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
            <Link to="/creator" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Icon name="bar_chart" className="text-primary-container" />
                <span className="font-label-md text-label-md text-on-surface">Creator Dashboard</span>
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
    </div>
  )
}
