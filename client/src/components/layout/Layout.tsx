import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import TopNav from './TopNav'
import MobileDrawer from './MobileDrawer'
import { ToastContainer } from '../ui/Toast'
import { useStore } from '../../store/useStore'

export default function Layout() {
  const collapsed = useStore((s) => s.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-[#050505] text-on-surface">
      <TopNav />
      <Sidebar />
      <MobileDrawer />

      <main
        className={`min-h-screen pt-16 pb-nav lg:pb-0 transition-all duration-300 ease-in-out ${
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
