import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext'
import Icon from '../ui/Icon'
import { useAdminPermissions } from '../../lib/useAdminPermissions'

interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
  perm?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: 'space_dashboard', end: true, perm: 'dashboard.view' }],
  },
  {
    title: 'Content',
    items: [
      { to: '/admin/content', label: 'Content & Catalog', icon: 'video_library', perm: 'content.view' },
      { to: '/admin/shorts', label: 'Shorts', icon: 'smart_display', perm: 'content.view' },
    ],
  },
  {
    title: 'Business',
    items: [
      { to: '/admin/analytics', label: 'Analytics & Revenue', icon: 'monitoring', perm: 'analytics.view' },
      { to: '/admin/transactions', label: 'Transactions', icon: 'payments', perm: 'finance.view' },
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: 'subscriptions', perm: 'finance.view' },
    ],
  },
  {
    title: 'People',
    items: [
      { to: '/admin/users', label: 'Users & Access', icon: 'group', perm: 'users.view' },
      { to: '/admin/creators', label: 'Creator Studio', icon: 'videocam', perm: 'creators.view' },
      { to: '/admin/community', label: 'Community', icon: 'forum', perm: 'community.view' },
    ],
  },
  {
    title: 'Safety',
    items: [{ to: '/admin/moderation', label: 'Content Moderation', icon: 'gavel', perm: 'moderation.view' }],
  },
  {
    title: 'Marketing',
    items: [
      { to: '/admin/announcements', label: 'Push Notifications', icon: 'notifications_active', perm: 'marketing.announce' },
      { to: '/admin/marketing', label: 'Promo & Banners', icon: 'campaign', perm: 'marketing.promo' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/admin/roles', label: 'Roles & Permissions', icon: 'admin_panel_settings', perm: 'users.roles' },
      { to: '/admin/feed-settings', label: 'Feed & Algorithm', icon: 'tune', perm: 'feed.edit' },
      { to: '/admin/settings', label: 'Settings & Audit', icon: 'settings', perm: 'settings.view' },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { isSuper, can, loading, roleName } = useAdminPermissions()

  const visible = GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(i.perm)) })).filter((g) => g.items.length > 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <aside className="fixed inset-y-0 left-0 w-60 border-r border-white/5 bg-surface-container-low/70 backdrop-blur-xl z-40 overflow-y-auto hidden md:block">
        <div className="px-4 py-4 flex items-center gap-2">
          <img src="/combination-mark-logo.png" alt="NovaFlix" className="w-9 h-9 object-contain" />
          <div className="min-w-0">
            <p className="font-label-md text-label-md text-on-surface truncate">NovaFlix</p>
            <p className="text-[10px] text-primary uppercase tracking-wider">Admin Console</p>
          </div>
        </div>

        {loading ? (
          <p className="px-4 text-xs text-on-surface-variant">Loading access…</p>
        ) : (
          <div className="px-4 pb-2">
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-surface-variant text-on-surface-variant">
              {roleName || (isSuper ? 'Super Admin' : 'Admin')}
            </span>
          </div>
        )}

        <nav className="px-3 pb-6">
          {visible.map((group, gi) => (
            <div key={gi} className="mb-2">
              <p className="px-2 mt-3 mb-1 text-[10px] uppercase tracking-wider text-on-surface-variant/50 font-semibold">{group.title}</p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                      isActive
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                    }`
                  }
                >
                  <Icon name={item.icon} size="sm" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile nav bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel flex overflow-x-auto gap-1 px-2 py-2">
        {visible.flatMap((g) => g.items).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${isActive ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`
            }
          >
            <Icon name={item.icon} size="sm" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className="flex-1 min-w-0 md:ml-60 pb-16 md:pb-0">
        <header className="sticky top-0 z-30 h-14 px-4 md:px-6 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <p className="font-label-md text-label-md text-on-surface-variant">Admin Console</p>
          <div className="flex items-center gap-3">
            <NavLink to="/home" className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
              <Icon name="arrow_back" size="sm" /> <span className="hidden sm:inline">Back to app</span>
            </NavLink>
            {user && (
              <button onClick={handleLogout} className="text-sm text-on-surface-variant hover:text-error transition-colors flex items-center gap-1">
                <Icon name="logout" size="sm" /> {user.name}
              </button>
            )}
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </main>
    </div>
  )
}
