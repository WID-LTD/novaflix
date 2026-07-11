import { NavLink } from 'react-router-dom'
import { Home, Search, Compass, Bookmark, User } from 'lucide-react'

const items = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/watchlist', icon: Bookmark, label: 'Library' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-secondary border-t border-white/10 z-50">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 transition-colors duration-200 ${
                isActive ? 'text-accent' : 'text-gray-500'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
