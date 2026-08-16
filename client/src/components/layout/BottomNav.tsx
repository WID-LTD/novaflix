import { NavLink, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../lib/AuthContext'
import Icon from '../ui/Icon'

interface NavItem {
  to: string
  icon: string
  label: string
  match?: (path: string) => boolean
}

function GuestBottomNav(): NavItem[] {
  return [
    { to: '/home', icon: 'home', label: 'Home', match: (p) => p === '/' || p.startsWith('/home') },
    { to: '/search', icon: 'search', label: 'Search', match: (p) => p.startsWith('/search') },
    { to: '/discover', icon: 'explore', label: 'Discover', match: (p) => p.startsWith('/discover') },
    { to: '/category', icon: 'category', label: 'Categories', match: (p) => p.startsWith('/category') },
    { to: '/login', icon: 'login', label: 'Sign In', match: (p) => p.startsWith('/login') || p.startsWith('/register') },
  ]
}

function UserBottomNav(): NavItem[] {
  return [
    { to: '/home', icon: 'home', label: 'Home', match: (p) => p === '/' || p.startsWith('/home') },
    { to: '/search', icon: 'search', label: 'Search', match: (p) => p.startsWith('/search') },
    { to: '/discover', icon: 'explore', label: 'Discover', match: (p) => p.startsWith('/discover') },
    { to: '/category', icon: 'category', label: 'Categories', match: (p) => p.startsWith('/category') },
    { to: '/profile', icon: 'person', label: 'Profile', match: (p) => p.startsWith('/profile') },
  ]
}

function CreatorBottomNav(): NavItem[] {
  return [
    { to: '/home', icon: 'home', label: 'Home', match: (p) => p === '/' || p.startsWith('/home') },
    { to: '/creator', icon: 'bar_chart', label: 'Dashboard', match: (p) => p.startsWith('/creator') || p.startsWith('/upload') },
    { to: '/search', icon: 'search', label: 'Search', match: (p) => p.startsWith('/search') },
    { to: '/discover', icon: 'explore', label: 'Discover', match: (p) => p.startsWith('/discover') },
    { to: '/profile', icon: 'person', label: 'Profile', match: (p) => p.startsWith('/profile') },
  ]
}

function AdminBottomNav(): NavItem[] {
  return [
    { to: '/home', icon: 'home', label: 'Home', match: (p) => p === '/' || p.startsWith('/home') },
    { to: '/admin', icon: 'admin_panel_settings', label: 'Admin', match: (p) => p.startsWith('/admin') },
    { to: '/discover', icon: 'explore', label: 'Discover', match: (p) => p.startsWith('/discover') },
    { to: '/category', icon: 'category', label: 'Categories', match: (p) => p.startsWith('/category') },
    { to: '/profile', icon: 'person', label: 'Profile', match: (p) => p.startsWith('/profile') },
  ]
}

export default function BottomNav() {
  const location = useLocation()
  const { user, isCreator, isAdmin } = useAuth()

  const items: NavItem[] = useMemo(() => {
    if (isAdmin) return AdminBottomNav()
    if (isCreator) return CreatorBottomNav()
    if (user) return UserBottomNav()
    return GuestBottomNav()
  }, [user, isCreator, isAdmin])

  const activeIndex = useMemo(() => {
    const idx = items.findIndex((item) => item.match?.(location.pathname))
    return idx >= 0 ? idx : 0
  }, [location.pathname, items])

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-2xl border-t border-white/5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-md mx-auto flex items-stretch py-1.5 px-1.5">
        {items.map((item, i) => {
          const isActive = activeIndex === i
          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl transition-all duration-150"
            >
              <span
                className={`flex flex-col items-center justify-center gap-0.5 w-full py-1 rounded-lg transition-all duration-150 ${
                  isActive ? 'bg-white/5 text-primary' : 'text-on-surface-variant/60 hover:text-on-surface'
                }`}
              >
                <Icon
                  name={item.icon}
                  fill={isActive}
                  size="sm"
                  className={isActive ? 'scale-110' : ''}
                />
                <span className="font-label-sm text-[10px] leading-tight text-center truncate w-full">{item.label}</span>
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
