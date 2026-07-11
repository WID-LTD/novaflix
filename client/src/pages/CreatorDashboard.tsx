import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Film, Users, DollarSign, Eye, TrendingUp,
  Globe, Calendar, Clock,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { getCreatorStats } from '../lib/auth'
import PremiumBadge from '../components/ui/PremiumBadge'
import Skeleton from '../components/ui/Skeleton'

const topLocations = [
  { country: 'United States', flag: '🇺🇸', viewers: 4520 },
  { country: 'United Kingdom', flag: '🇬🇧', viewers: 2104 },
  { country: 'Germany', flag: '🇩🇪', viewers: 1892 },
  { country: 'Canada', flag: '🇨🇦', viewers: 1438 },
  { country: 'Brazil', flag: '🇧🇷', viewers: 983 },
]

export default function CreatorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    const token = localStorage.getItem('novaflix-token') || ''
    getCreatorStats(token).then((res) => {
      if (res.success) setData(res.stats)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user, navigate])

  const stats = data ? [
    { icon: Eye, label: 'Total Minutes Streamed', value: (data.totalMinutesWatched || 0).toLocaleString(), change: '+12.3%', color: 'text-info' },
    { icon: DollarSign, label: 'Revenue', value: `$${(data.revenue || 0).toLocaleString()}`, change: '+8.1%', color: 'text-success' },
    { icon: Film, label: 'Uploads', value: String(data.totalUploads || 0), change: '+24.7%', color: 'text-creator' },
    { icon: TrendingUp, label: 'Total Views', value: (data.totalViews || 0).toLocaleString(), change: '+5.2%', color: 'text-premium' },
  ] : []

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-creator" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Creator Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">Your films, your audience, your revenue</p>
            </div>
          </div>
          <PremiumBadge size="md" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-card border border-white/10 rounded-2xl p-5">
                <Skeleton variant="text" className="w-8 h-8 mb-3 rounded-lg" />
                <Skeleton variant="text" className="w-20 h-6 mb-1" />
                <Skeleton variant="text" className="w-24 h-3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface-card border border-white/10 rounded-2xl p-5"
                >
                  <Icon className={`w-6 h-6 ${stat.color} mb-3`} />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  <span className="text-xs text-success font-medium">{stat.change}</span>
                </motion.div>
              )
            })}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-surface-card border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Film className="w-5 h-5 text-creator" /> Your Films
            </h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="text" className="h-12 rounded-xl" />
                ))}
              </div>
            ) : data?.uploads?.length > 0 ? (
              <div className="space-y-3">
                {data.uploads.map((film: any) => (
                  <div key={film.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{film.title}</p>
                      <p className="text-xs text-gray-500">{film.views || 0} views</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {Math.round((film.minutesWatched || 0) / 60)}h
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-success" /> ${film.revenue || 0}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        film.status === 'published' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                      }`}>
                        {film.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No films uploaded yet</p>
            )}
          </div>

          <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-info" /> Top Locations
            </h2>
            <div className="space-y-3">
              {topLocations.map((loc) => (
                <div key={loc.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{loc.flag}</span>
                    <span className="text-sm text-gray-300">{loc.country}</span>
                  </div>
                  <span className="text-sm text-gray-500">{loc.viewers.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-card border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-premium" /> Payout Summary
          </h2>
          {loading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="text" className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-lg font-bold text-white">${(data?.revenue || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-600">Lifetime earnings</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Tips Received</p>
                <p className="text-lg font-bold text-white">${(data?.tipRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-600">From fans</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Total Views</p>
                <p className="text-lg font-bold text-white">{(data?.totalViews || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-600">Across all films</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
