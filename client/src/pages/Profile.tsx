import { Link, useNavigate } from 'react-router-dom'
import { User, Settings, Bookmark, Clock, Star, Film, Tv, Crown, BarChart3, Award, TrendingUp, LogOut } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useAuth } from '../lib/AuthContext'
import Button from '../components/ui/Button'
import PremiumBadge from '../components/ui/PremiumBadge'

const badges = [
  { icon: Star, label: 'Film Buff', desc: 'Watch 10+ films', earned: false },
  { icon: TrendingUp, label: 'Trend Setter', desc: 'Add 5 to watchlist', earned: false },
  { icon: Clock, label: 'Night Owl', desc: 'Watch after midnight', earned: false },
  { icon: Award, label: 'Explorer', desc: 'Visit 5 genres', earned: false },
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
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-20">
      <div className="max-w-4xl mx-auto">
        {!isPremium && (
          <div className="bg-gradient-to-r from-accent/10 to-accent-secondary/5 border border-premium/20 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-secondary-light flex items-center justify-center">
                <Crown className="w-7 h-7 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Upgrade to Premium</h3>
                <p className="text-sm text-gray-400">Unlock 4K, offline downloads, ad-free streaming</p>
              </div>
              <Link to="/pricing">
                <Button size="sm">
                  <Crown className="w-4 h-4 fill-current" /> View Plans
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">{user?.name || 'Guest'}</h1>
            <p className="text-gray-400 text-sm mt-1">{user?.email || 'Sign in to sync across devices'}</p>
            {isPremium && (
              <div className="mt-2">
                <PremiumBadge size="sm" />
              </div>
            )}
          </div>
          {user && (
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
            <Bookmark className="w-6 h-6 text-accent mb-3" />
            <p className="text-2xl font-bold">{watchlist.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Saved</p>
          </div>
          <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
            <Film className="w-6 h-6 text-accent mb-3" />
            <p className="text-2xl font-bold">{movieCount}</p>
            <p className="text-xs text-gray-400 mt-1">Movies</p>
          </div>
          <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
            <Tv className="w-6 h-6 text-accent mb-3" />
            <p className="text-2xl font-bold">{tvCount}</p>
            <p className="text-xs text-gray-400 mt-1">TV Shows</p>
          </div>
          <div className="bg-surface-card border border-white/10 rounded-2xl p-5">
            <Clock className="w-6 h-6 text-accent-secondary mb-3" />
            <p className="text-2xl font-bold">{totalMinutes}</p>
            <p className="text-xs text-gray-400 mt-1">Minutes Watched</p>
          </div>
        </div>

        {continueWatching.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Continue Watching</h2>
            <div className="space-y-2">
              {continueWatching.slice(0, 5).map((item) => (
                <div
                  key={`${item.id}-${item.type}`}
                  className="flex items-center gap-4 bg-surface-card border border-white/10 rounded-xl p-4"
                >
                  <div className="w-12 h-16 rounded-lg bg-surface-secondary overflow-hidden shrink-0">
                    {item.poster && (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {item.type === 'tv' && item.season
                        ? `S${item.season} E${item.episode}`
                        : 'Movie'}
                    </p>
                    <div className="w-full h-1 bg-surface rounded-full mt-2">
                      <div
                        className="h-full bg-accent rounded-full"
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
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" /> Achievements
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((b) => {
              const Icon = b.icon
              return (
                <div
                  key={b.label}
                  className={`bg-surface-card border rounded-2xl p-4 text-center ${
                    false ? 'border-premium/30' : 'border-white/10 opacity-40'
                  }`}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                  <p className="text-xs font-semibold text-gray-400">{b.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{b.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-surface-card border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link to="/settings" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-sm">Settings</span>
              </div>
              <span className="text-gray-500 text-sm">→</span>
            </Link>
            <Link to="/creator" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-accent" />
                <span className="text-sm">Creator Dashboard</span>
              </div>
              <span className="text-gray-500 text-sm">→</span>
            </Link>
            <Link to="/pricing" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-accent" />
                <span className="text-sm">Premium Plans</span>
              </div>
              <span className="text-gray-500 text-sm">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
