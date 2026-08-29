import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { getToken, getCreatorPpmConfig, saveCreatorPpmConfig } from '../lib/auth'
import { subscribeCreator } from '../lib/creatorLive'

const NAV = [
  { path: '/creator', label: 'Dashboard', icon: 'dashboard' },
  { path: '/creator/analytics', label: 'Analytics', icon: 'monitoring' },
  { path: '/creator/catalog', label: 'Catalog', icon: 'movie' },
  { path: '/creator/wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  { path: '/creator/ppm', label: 'PPM', icon: 'tune' },
  { path: '/creator/onboarding', label: 'Onboarding', icon: 'rocket_launch' },
  { path: '/creator/go-live', label: 'Go Live', icon: 'podcasts' },
]

// Industry reference: Pay-Per-Minute pools (rev-share on watch time)
const INDUSTRY_RANGE = { movie: [0.5, 8.0], short: [0.2, 4.0] }

export default function CreatorPPMSettings() {
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [movieVpm, setMovieVpm] = useState('2.50')
  const [shortVpm, setShortVpm] = useState('1.20')
  const [minPayout, setMinPayout] = useState('50.00')
  const [autoSettle, setAutoSettle] = useState(true)
  const [estimateMinutes, setEstimateMinutes] = useState('1000')

  const load = async () => {
    const token = getToken()
    if (!token) return
    const r = await getCreatorPpmConfig(token)
    if (r.success && r.config) {
      setConfig(r.config)
      setMovieVpm(String(r.config.movie_vpm))
      setShortVpm(String(r.config.short_vpm))
      setMinPayout(String(r.config.minimum_payout))
      setAutoSettle(!!r.config.auto_settle)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return subscribeCreator('content', (msg) => {
      if (msg.action === 'ppm-updated' && msg.config) setConfig(msg.config)
    })
  }, [])

  const mv = parseFloat(movieVpm)
  const sv = parseFloat(shortVpm)
  const em = parseFloat(estimateMinutes) || 0

  const estimate = useMemo(() => {
    const movie = mv * em
    const short = sv * em
    return { movie, short, total: movie + short }
  }, [mv, sv, em])

  const handleSave = async () => {
    const token = getToken()
    if (!token) return
    setSaving(true)
    const r = await saveCreatorPpmConfig(token, { movie_vpm: mv, short_vpm: sv, minimum_payout: parseFloat(minPayout) || 50, auto_settle: autoSettle })
    setSaving(false)
    if (r.success) { setConfig(r.config); toast.success('PPM settings saved') }
    else toast.error(r.error || 'Failed to save')
  }

  if (loading) {
    return <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav"><div className="max-w-4xl mx-auto"><Skeleton variant="rect" className="h-64 rounded-xl" /></div></div>
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="tune" className="w-7 h-7 text-primary-container" />
          <div>
            <h1 className="text-headline-md font-bold">Pay-Per-Minute Settings</h1>
            <p className="text-on-surface-variant/60 text-xs mt-0.5">Control your revenue rate per minute watched</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto mb-6 pb-1">
          {NAV.map(n => (
            <button key={n.path} onClick={() => nav(n.path)} className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors ${loc.pathname === n.path ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
              <Icon name={n.icon as any} size="sm" /> {n.label}
            </button>
          ))}
        </nav>

        <div className="grid md:grid-cols-2 gap-gutter mb-6">
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
            <h3 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-2"><Icon name="movie" className="text-primary-container" /> Movie PPM</h3>
            <p className="text-xs text-on-surface-variant/60 mb-4">Earnings per 1000 minutes watched on films (${INDUSTRY_RANGE.movie[0]} – ${INDUSTRY_RANGE.movie[1]} industry)</p>
            <div className="flex items-center gap-3">
              <input value={movieVpm} onChange={(e) => setMovieVpm(e.target.value.replace(/[^0-9.]/g, ''))} type="number" className="w-32 bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-container" />
              <span className="text-on-surface-variant text-sm">/ 1000 min</span>
            </div>
          </div>
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
            <h3 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-2"><Icon name="bolt" className="text-primary-container" /> Short PPM</h3>
            <p className="text-xs text-on-surface-variant/60 mb-4">Earnings per 1000 minutes watched on shorts (${INDUSTRY_RANGE.short[0]} – ${INDUSTRY_RANGE.short[1]} industry)</p>
            <div className="flex items-center gap-3">
              <input value={shortVpm} onChange={(e) => setShortVpm(e.target.value.replace(/[^0-9.]/g, ''))} type="number" className="w-32 bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-container" />
              <span className="text-on-surface-variant text-sm">/ 1000 min</span>
            </div>
          </div>
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
            <h3 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-2"><Icon name="account_balance" className="text-primary-container" /> Minimum payout</h3>
            <p className="text-xs text-on-surface-variant/60 mb-4">Withdrawals available once balance reaches this amount</p>
            <div className="flex items-center gap-3">
              <span className="text-on-surface-variant text-sm">$</span>
              <input value={minPayout} onChange={(e) => setMinPayout(e.target.value.replace(/[^0-9.]/g, ''))} type="number" className="w-32 bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-container" />
            </div>
          </div>
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-6">
            <h3 className="font-label-md text-label-md text-on-surface mb-2 flex items-center gap-2"><Icon name="autorenew" className="text-primary-container" /> Auto-settle</h3>
            <p className="text-xs text-on-surface-variant/60 mb-4">Automatically settle monthly earnings into your balance</p>
            <button onClick={() => setAutoSettle(!autoSettle)} className={`relative w-12 h-6 rounded-full transition-colors ${autoSettle ? 'bg-primary-container' : 'bg-white/10'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-on-primary transition-all ${autoSettle ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="bg-surface-container-high border border-white/5 rounded-xl p-6 mb-6">
          <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2"><Icon name="calculate" className="text-primary-container" /> Earnings preview calculator</h3>
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <label className="text-on-surface-variant text-sm">Est. minutes watched:</label>
            <input value={estimateMinutes} onChange={(e) => setEstimateMinutes(e.target.value.replace(/[^0-9.]/g, ''))} type="number" className="w-40 bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-container" />
          </div>
          <div className="grid grid-cols-3 gap-gutter">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-on-surface-variant">Movies</p>
              <p className="text-xl font-bold text-on-surface">${estimate.movie.toFixed(2)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-on-surface-variant">Shorts</p>
              <p className="text-xl font-bold text-on-surface">${estimate.short.toFixed(2)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-on-surface-variant">Total</p>
              <p className="text-xl font-bold text-primary-container">${estimate.total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>Save PPM settings</Button>
        </div>
      </div>
    </div>
  )
}
