import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import TopNav from './TopNav'
import MobileDrawer from './MobileDrawer'
import { ToastContainer } from '../ui/Toast'
import { useStore } from '../../store/useStore'
import { useAuth } from '../../lib/AuthContext'
import { useEffect } from 'react'

export default function Layout() {
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const { user, accountStatus } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user && (accountStatus === 'suspended' || accountStatus === 'banned') && location.pathname !== '/suspended') {
      navigate('/suspended', { replace: true })
    }
  }, [user, accountStatus, location.pathname, navigate])

  return (
    <div className="min-h-screen bg-[#050505] text-on-surface">
      <TopNav />
      <Sidebar />
      <MobileDrawer />

      <main
        className={`min-h-screen pt-[96px] pb-nav lg:pb-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        <Outlet />
      </main>

      <BottomNav />
      <ToastContainer />
      <div id="preview-portal-root" />
    </div>
  )
}
