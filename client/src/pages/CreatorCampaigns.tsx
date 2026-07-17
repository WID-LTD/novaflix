import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Skeleton from '../components/ui/Skeleton'

interface Campaign {
  id: string
  advertiser_name: string
  creative_url: string
  creative_type: string
  promotion_type: string
  target_genre: string | null
  max_impressions: number
  current_impressions: number
  budget: number
  spent: number
  approved: boolean
  active: boolean
  start_date: string
  end_date: string | null
  created_at: string
}

export default function CreatorCampaigns() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    advertiser_name: '',
    creative_url: '',
    creative_type: 'image',
    promotion_type: 'grid',
    target_genre: '',
    max_impressions: 1000,
    budget: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchCampaigns = async () => {
    const token = localStorage.getItem('novaflix-token')
    const res = await fetch('/api/campaigns', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.success) setCampaigns(data.campaigns || [])
    setLoading(false)
  }

  useEffect(() => { fetchCampaigns() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const token = localStorage.getItem('novaflix-token')
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSubmitting(false)
    if (data.success) {
      setShowForm(false)
      setForm({ advertiser_name: '', creative_url: '', creative_type: 'image', promotion_type: 'grid', target_genre: '', max_impressions: 1000, budget: 0 })
      fetchCampaigns()
    }
  }

  const toggleActive = async (id: string, current: boolean) => {
    const token = localStorage.getItem('novaflix-token')
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !current }),
    })
    fetchCampaigns()
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-headline-md font-bold text-on-surface">Promotions</h1>
            <p className="text-on-surface-variant text-sm mt-1">Promote your content to NovaFlix viewers</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Icon name="add" /> New Campaign
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-surface-container-high border border-white/5 rounded-xl p-6 mb-8 space-y-4">
            <h2 className="font-label-md text-label-md text-on-surface mb-4">Create Campaign</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Advertiser Name</label>
                <Input value={form.advertiser_name} onChange={(e) => setForm({ ...form, advertiser_name: e.target.value })} placeholder="Your brand name" required />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Creative URL</label>
                <Input value={form.creative_url} onChange={(e) => setForm({ ...form, creative_url: e.target.value })} placeholder="https://..." required />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Placement Type</label>
                <select
                  value={form.promotion_type}
                  onChange={(e) => setForm({ ...form, promotion_type: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2.5 text-sm on-surface"
                >
                  <option value="grid">Grid (Discovery)</option>
                  <option value="hooks">Hooks Feed</option>
                  <option value="banner">Banner</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Max Impressions</label>
                <Input type="number" value={String(form.max_impressions)} onChange={(e) => setForm({ ...form, max_impressions: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Budget (NGN)</label>
                <Input type="number" value={String(form.budget)} onChange={(e) => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Target Genre (optional)</label>
                <Input value={form.target_genre} onChange={(e) => setForm({ ...form, target_genre: e.target.value })} placeholder="e.g. Action" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Campaign'}</Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-32" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="campaign" className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
            <p className="text-on-surface-variant">No campaigns yet. Create your first promotion.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => (
              <div key={c.id} className="bg-surface-container-high border border-white/5 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {c.creative_type === 'image' && c.creative_url && (
                      <img src={c.creative_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-surface-container" />
                    )}
                    <div>
                      <h3 className="font-label-md text-label-md text-on-surface">{c.advertiser_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant/60">
                        <span className={`px-2 py-0.5 rounded ${c.approved ? 'bg-secondary/20 text-secondary' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {c.approved ? 'Approved' : 'Pending'}
                        </span>
                        <span>{c.promotion_type}</span>
                        <span>{c.current_impressions}/{c.max_impressions || '∞'} impressions</span>
                        {c.budget > 0 && <span>₦{c.spent}/{c.budget}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(c.id, c.active)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        c.active ? 'bg-secondary/20 text-secondary' : 'bg-surface-variant/40 text-on-surface-variant/40'
                      }`}
                      aria-label={c.active ? 'Pause' : 'Activate'}
                    >
                      <Icon name={c.active ? 'pause' : 'play_arrow'} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
