import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import { useStore } from '../../store/useStore'
import Icon from '../ui/Icon'
import SearchLightbox from '../ui/SearchLightbox'

export default function TopNav() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const toggleMobileDrawer = useStore((s) => s.toggleMobileDrawer)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-panel h-16 flex justify-between items-center px-margin-mobile md:px-margin-desktop">
      <SearchLightbox open={searchOpen} onClose={() => setSearchOpen(false)} />
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileDrawer}
          className="lg:hidden p-3 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
          aria-label="Open navigation menu"
        >
          <Icon name="menu" />
        </button>
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-3 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Icon name="menu" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <span className="text-headline-md md:text-headline-lg text-primary-container tracking-tight font-extrabold">
            NovaFlix
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-6 ml-8">
          <Link to="/home" className="font-label-md text-label-md text-primary transition-colors">Home</Link>
          <Link to="/search?type=movie" className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">Movies</Link>
          <Link to="/tv-shows" className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">TV Shows</Link>
          <Link to="/discover?sort=trending" className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors">New & Popular</Link>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setSearchOpen(true)} className="text-on-surface-variant hover:text-primary transition-colors p-2" aria-label="Search">
          <Icon name="search" />
        </button>
        {user && (
          <button className="text-on-surface-variant hover:text-primary transition-colors p-2" aria-label="Notifications">
            <Icon name="notifications" />
          </button>
        )}
        <button
          onClick={() => navigate(user ? '/profile' : '/login')}
          className="w-8 h-8 rounded-xl overflow-hidden border border-surface-variant bg-surface-container-high"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              <Icon name="person" size="sm" />
            </div>
          )}
        </button>
      </div>
    </header>
  )
}
