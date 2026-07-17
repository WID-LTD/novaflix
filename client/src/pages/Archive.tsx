import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { getToken } from '../lib/auth'

const BASE = '/api'

export default function Archive() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = getToken()

  useEffect(() => {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    fetch(`${BASE}/archive`, { headers }).then(r => r.json()).then(r => {
      if (r.success) setItems(r.items)
      setLoading(false)
    })
  }, [token])

  const handleClick = async (id: string) => {
    if (!token) { navigate('/login'); return }
    const res = await fetch(`${BASE}/archive/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (data.success) navigate(`/archive/${id}`)
    else if (data.requiredPlan) navigate(`/pricing?upgrade=${data.requiredPlan}`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-container" /></div>

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Icon name="archive" className="w-8 h-8 text-primary-container" />
          <h1 className="text-headline-lg font-bold">Archive Vault</h1>
        </div>
        <p className="text-on-surface-variant/60 text-sm mb-8">Exclusive archived content — classics, behind-the-scenes, and more</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item, i) => {
            const planLabels: Record<string, string> = { free: 'Free', student: 'Student', basic: 'Basic', standard: 'Standard', premium: 'Premium' }
            const planColors: Record<string, string> = { free: 'bg-gray-500/20 text-gray-400', student: 'bg-blue-500/20 text-blue-400', basic: 'bg-green-500/20 text-green-400', standard: 'bg-yellow-500/20 text-yellow-400', premium: 'bg-purple-500/20 text-purple-400' }
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleClick(item.id)}
                className="bg-surface-container rounded-2xl overflow-hidden text-left hover:ring-2 hover:ring-primary-container/50 transition-all group"
              >
                <div className="aspect-video bg-surface flex items-center justify-center overflow-hidden">
                  {item.poster_url ? (
                    <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <Icon name={item.content_type === 'article' ? 'article' : item.content_type === 'audio' ? 'audiotrack' : 'video_library'} className="text-4xl text-on-surface-variant/30" />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${planColors[item.min_plan] || 'bg-gray-500/20 text-gray-400'}`}>{planLabels[item.min_plan] || item.min_plan}</span>
                    {item.genre && <span className="text-[10px] text-on-surface-variant/60">{item.genre}</span>}
                  </div>
                  <h3 className="font-label-md text-on-surface truncate">{item.title}</h3>
                  {item.year && <p className="text-label-xs text-on-surface-variant">{item.year}</p>}
                </div>
              </motion.button>
            )
          })}
          {items.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Icon name="archive" className="text-5xl text-on-surface-variant/20 mb-4" />
              <p className="text-body-lg text-on-surface-variant">No archived content available for your plan</p>
              <p className="text-body-sm text-on-surface-variant/60 mt-1">Upgrade to access more exclusive content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
