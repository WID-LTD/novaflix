import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { ToastContainer } from '../ui/Toast'
import { useStore } from '../../store/useStore'

export default function Layout() {
  const collapsed = useStore((s) => s.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <BottomNav />

      <main
        className={`
          transition-all duration-300 ease-in-out
          lg:ml-${collapsed ? '16' : '60'}
          pb-16 lg:pb-0
        `}
        style={{
          marginLeft: collapsed ? 64 : 240,
        }}
      >
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}
