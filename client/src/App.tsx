import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AuthGuard from './components/layout/AuthGuard'
import AdminGuard from './components/layout/AdminGuard'
import CreatorGuard from './components/layout/CreatorGuard'
import Skeleton from './components/ui/Skeleton'

const Landing = lazy(() => import('./pages/Landing'))
const Home = lazy(() => import('./pages/Home'))
const Search = lazy(() => import('./pages/Search'))
const MovieDetail = lazy(() => import('./pages/MovieDetail'))
const Watch = lazy(() => import('./pages/Watch'))
const TVShows = lazy(() => import('./pages/TVShows'))
const Discover = lazy(() => import('./pages/Discover'))
const Watchlist = lazy(() => import('./pages/Watchlist'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))
const CreatorLogin = lazy(() => import('./pages/CreatorLogin'))
const Pricing = lazy(() => import('./pages/Pricing'))
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'))
const Upload = lazy(() => import('./pages/Upload'))
const Store = lazy(() => import('./pages/Store'))
const Learn = lazy(() => import('./pages/Learn'))
const WatchParty = lazy(() => import('./pages/WatchParty'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Creators = lazy(() => import('./pages/Creators'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoading() {
  return (
    <div className="p-8 space-y-4">
      <Skeleton variant="text" className="w-64 h-8" />
      <Skeleton variant="text" className="w-full h-4" />
      <Skeleton variant="text" className="w-full h-4" />
      <div className="grid grid-cols-4 gap-4 mt-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="poster" className="w-full" />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/creator/login" element={<CreatorLogin />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/search" element={<Search />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/tv/:id" element={<MovieDetail />} />
          <Route path="/watch" element={<AuthGuard><Watch /></AuthGuard>} />
          <Route path="/tv-shows" element={<TVShows />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/watchlist" element={<AuthGuard><Watchlist /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/creator" element={<CreatorGuard><CreatorDashboard /></CreatorGuard>} />
          <Route path="/upload" element={<AuthGuard><Upload /></AuthGuard>} />
          <Route path="/store" element={<Store />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/watch-party" element={<AuthGuard><WatchParty /></AuthGuard>} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
