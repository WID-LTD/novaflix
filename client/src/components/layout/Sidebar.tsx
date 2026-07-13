import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home, Clapperboard, Tv, TrendingUp, Star, Compass,
  Bookmark, User, Settings, ChevronLeft, Film,
  Crown, BarChart3, Upload, ShoppingBag, BookOpen, Users,
  Shield, LogIn,
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useAuth } from '../../lib/AuthContext'

export default function Sidebar() {
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const toggle = useStore((s) => s.toggleSidebar)
  const { user, isCreator, isAdmin } = useAuth()

  const navItems = [
    { to: '/home', icon: Home, label: 'Home', auth: false },
    { to: '/search?type=movie', icon: Clapperboard, label: 'Movies', auth: false },
    { to: '/tv-shows', icon: Tv, label: 'TV Shows', auth: false },
    { to: '/discover?sort=trending', icon: TrendingUp, label: 'Trending', auth: false },
    { to: '/discover?sort=top_rated', icon: Star, label: 'Top Rated', auth: false },
    { to: '/discover', icon: Compass, label: 'Discover', auth: false },
    { to: '/watchlist', icon: Bookmark, label: 'Watchlist', auth: true },
    { to: '/profile', icon: User, label: 'Profile', auth: true },
    { to: '/settings', icon: Settings, label: 'Settings', auth: false },
  ]

  const businessItems = [
    { to: '/pricing', icon: Crown, label: 'Plans', color: 'text-accent', auth: false },
    { to: '/creator', icon: BarChart3, label: 'Creator Hub', color: 'text-accent', auth: true, creatorOnly: true },
    { to: '/upload', icon: Upload, label: 'Upload Film', color: 'text-accent', auth: true, creatorOnly: true },
    { to: '/store', icon: ShoppingBag, label: 'Merch Store', color: 'text-accent', auth: false },
    { to: '/learn', icon: BookOpen, label: 'E-Learning', color: 'text-accent', auth: false },
    { to: '/watch-party', icon: Users, label: 'Watch Party', color: 'text-accent', auth: true },
  ]

  const visibleNav = navItems.filter(i => !i.auth || user)
  const visibleBusiness = businessItems.filter(i => {
    if (i.auth && !user) return false
    if (i.creatorOnly && !isCreator) return false
    return true
  })

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
        {visibleNav.map((item) => (
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

        {!user && (
          <NavLink
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogIn className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Sign In</span>}
          </NavLink>
        )}

        {!collapsed && (
          <div className="my-3 px-3">
            <div className="h-px bg-white/10" />
          </div>
        )}

        {visibleBusiness.map((item) => (
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

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 ${
                isActive ? 'text-green-400 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Shield className="w-5 h-5 shrink-0 text-green-400" />
            {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Admin Panel</span>}
          </NavLink>
        )}
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
