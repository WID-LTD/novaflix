import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home, Clapperboard, Tv, TrendingUp, Star, Compass,
  Bookmark, User, Settings, ChevronLeft, Film,
  Crown, BarChart3, Upload, ShoppingBag, BookOpen, Users,
} from 'lucide-react'
import { useStore } from '../../store/useStore'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search?type=movie', icon: Clapperboard, label: 'Movies' },
  { to: '/tv-shows', icon: Tv, label: 'TV Shows' },
  { to: '/discover?sort=trending', icon: TrendingUp, label: 'Trending' },
  { to: '/discover?sort=top_rated', icon: Star, label: 'Top Rated' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

const businessItems = [
  { to: '/pricing', icon: Crown, label: 'Plans', color: 'text-premium' },
  { to: '/creator', icon: BarChart3, label: 'Creator Hub', color: 'text-creator' },
  { to: '/upload', icon: Upload, label: 'Upload Film', color: 'text-creator' },
  { to: '/store', icon: ShoppingBag, label: 'Merch Store', color: 'text-premium' },
  { to: '/learn', icon: BookOpen, label: 'E-Learning', color: 'text-creator' },
  { to: '/watch-party', icon: Users, label: 'Watch Party', color: 'text-info' },
]

export default function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const toggle = useStore((s) => s.toggleSidebar)

  return (
    <motion.nav
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-screen bg-surface-secondary border-r border-white/10 z-40 flex flex-col py-4 overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 mb-6 h-10">
        <Film className="w-7 h-7 text-accent shrink-0" />
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold tracking-tight"
          >
            Nova<span className="text-accent">Flix</span>
          </motion.span>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 ${
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            )}
          </NavLink>
        ))}

        {!collapsed && (
          <div className="my-3 px-3">
            <div className="h-px bg-white/10" />
          </div>
        )}

        {businessItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 ${
                isActive
                  ? `${item.color} bg-white/5`
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className={`w-5 h-5 shrink-0 ${item.color}`} />
            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            )}
          </NavLink>
        ))}
      </div>

      <div className="px-2 mt-auto">
        <button
          onClick={toggle}
          className="flex items-center justify-center w-full p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
        </button>
      </div>
    </motion.nav>
  )
}
