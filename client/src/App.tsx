import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AuthGuard from './components/layout/AuthGuard'
import AdminGuard from './components/layout/AdminGuard'
import CreatorGuard from './components/layout/CreatorGuard'
import Skeleton from './components/ui/Skeleton'

const Landing = lazy(() => import('./pages/Landing'))
const Splash = lazy(() => import('./pages/Splash'))
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
const Register = lazy(() => import('./pages/Register'))
const ProfileGateway = lazy(() => import('./pages/ProfileGateway'))
const CreatorLogin = lazy(() => import('./pages/CreatorLogin'))
const Pricing = lazy(() => import('./pages/Pricing'))
const CreatorDashboard = lazy(() => import('./pages/CreatorDashboard'))
const CreatorPlanPicker = lazy(() => import('./pages/CreatorPlanPicker'))
const Upload = lazy(() => import('./pages/Upload'))
const Store = lazy(() => import('./pages/Store'))
const Learn = lazy(() => import('./pages/Learn'))
const WatchParty = lazy(() => import('./pages/WatchParty'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Community = lazy(() => import('./pages/Community'))
const Downloads = lazy(() => import('./pages/Downloads'))
const HooksFeed = lazy(() => import('./pages/HooksFeed'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const CreatorAnalytics = lazy(() => import('./pages/CreatorAnalytics'))
const CreatorProfileHub = lazy(() => import('./pages/CreatorProfileHub'))
const CreatorCatalog = lazy(() => import('./pages/CreatorCatalog'))
const CreatorCampaigns = lazy(() => import('./pages/CreatorCampaigns'))
const AdminAssetQC = lazy(() => import('./pages/AdminAssetQC'))
const AdminFilters = lazy(() => import('./pages/AdminFilters'))
const AdminCampaigns = lazy(() => import('./pages/AdminCampaigns'))
const AdminLocalization = lazy(() => import('./pages/AdminLocalization'))
const Referrals = lazy(() => import('./pages/Referrals'))
const CreatorMembershipManager = lazy(() => import('./pages/CreatorMembershipManager'))
const CreatorEventsManager = lazy(() => import('./pages/CreatorEventsManager'))
const LiveEvents = lazy(() => import('./pages/LiveEvents'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const RedCarpet = lazy(() => import('./pages/RedCarpet'))
const CreatorProducts = lazy(() => import('./pages/CreatorProducts'))
const CreatorCourses = lazy(() => import('./pages/CreatorCourses'))
const Archive = lazy(() => import('./pages/Archive'))
const ArchiveDetail = lazy(() => import('./pages/ArchiveDetail'))
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
        <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profiles" element={<ProfileGateway />} />
        <Route path="/creator/login" element={<CreatorLogin />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
          <Route path="/community/:id" element={<AuthGuard><Community /></AuthGuard>} />
          <Route path="/downloads" element={<AuthGuard><Downloads /></AuthGuard>} />
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
          <Route path="/hooks" element={<AuthGuard><HooksFeed /></AuthGuard>} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/creator" element={<CreatorGuard><CreatorDashboard /></CreatorGuard>} />
          <Route path="/creator/analytics" element={<CreatorGuard><CreatorAnalytics /></CreatorGuard>} />
          <Route path="/creator/profile" element={<CreatorGuard><CreatorProfileHub /></CreatorGuard>} />
          <Route path="/creator/catalog" element={<CreatorGuard><CreatorCatalog /></CreatorGuard>} />
          <Route path="/creator/campaigns" element={<CreatorGuard><CreatorCampaigns /></CreatorGuard>} />
          <Route path="/creator/choose-plan" element={<CreatorPlanPicker />} />
          <Route path="/upload" element={<AuthGuard><Upload /></AuthGuard>} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/product/:id" element={<Store />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/course/:id" element={<Learn />} />
          <Route path="/creator/products" element={<CreatorGuard><CreatorProducts /></CreatorGuard>} />
          <Route path="/creator/courses" element={<CreatorGuard><CreatorCourses /></CreatorGuard>} />
          <Route path="/referrals" element={<AuthGuard><Referrals /></AuthGuard>} />
          <Route path="/memberships" element={<AuthGuard><CreatorMembershipManager /></AuthGuard>} />
          <Route path="/memberships/:creatorId" element={<AuthGuard><CreatorMembershipManager /></AuthGuard>} />
          <Route path="/creator/memberships" element={<CreatorGuard><CreatorMembershipManager /></CreatorGuard>} />
          <Route path="/creator/events" element={<CreatorGuard><CreatorEventsManager /></CreatorGuard>} />
          <Route path="/events" element={<LiveEvents />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/red-carpet" element={<RedCarpet />} />
          <Route path="/archive" element={<AuthGuard><Archive /></AuthGuard>} />
          <Route path="/archive/:id" element={<AuthGuard><ArchiveDetail /></AuthGuard>} />
          <Route path="/watch-party" element={<AuthGuard requirePremium><WatchParty /></AuthGuard>} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="/admin/asset-qc" element={<AdminGuard><AdminAssetQC /></AdminGuard>} />
          <Route path="/admin/filters" element={<AdminGuard><AdminFilters /></AdminGuard>} />
          <Route path="/admin/campaigns" element={<AdminGuard><AdminCampaigns /></AdminGuard>} />
          <Route path="/admin/localization" element={<AdminGuard><AdminLocalization /></AdminGuard>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
