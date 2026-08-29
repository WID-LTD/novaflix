import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { getToken, getCreatorOnboarding, saveCreatorOnboarding } from '../lib/auth'

const NAV = [
  { path: '/creator', label: 'Dashboard', icon: 'dashboard' },
  { path: '/creator/analytics', label: 'Analytics', icon: 'monitoring' },
  { path: '/creator/catalog', label: 'Catalog', icon: 'movie' },
  { path: '/creator/wallet', label: 'Wallet', icon: 'account_balance_wallet' },
  { path: '/creator/ppm', label: 'PPM', icon: 'tune' },
  { path: '/creator/onboarding', label: 'Onboarding', icon: 'rocket_launch' },
  { path: '/creator/go-live', label: 'Go Live', icon: 'podcasts' },
]

const STEPS = [
  { title: 'Identity', icon: 'person' },
  { title: 'Links', icon: 'link' },
  { title: 'Monetization', icon: 'monetization_on' },
  { title: 'Payout', icon: 'account_balance' },
]

export default function CreatorOnboarding() {
  const nav = useNavigate()
  const loc = useLocation()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)

  const [identity, setIdentity] = useState({ fullName: '', stageName: '', bio: '' })
  const [links, setLinks] = useState({ website: '', instagram: '', youtube: '', tiktok: '' })
  const [monetization, setMonetization] = useState({ plan: 'basic', adsOn: false, memberships: true })
  const [payout, setPayout] = useState({ bankName: '', accountNumber: '', accountName: '' })

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    getCreatorOnboarding(token).then(r => {
      if (r.success && r.onboarding) {
        if (r.onboarding.identity) setIdentity({ fullName: '', stageName: '', bio: '', ...r.onboarding.identity })
        if (r.onboarding.links) setLinks({ website: '', instagram: '', youtube: '', tiktok: '', ...r.onboarding.links })
        if (r.onboarding.monetization) setMonetization({ plan: 'basic', adsOn: false, memberships: true, ...r.onboarding.monetization })
        if (r.onboarding.payout) setPayout({ bankName: '', accountNumber: '', accountName: '', ...r.onboarding.payout })
        setStep(r.onboarding.step || 1)
        setDone(!!r.onboarding.completed)
      }
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persist = async (nextStep: number, completed: boolean) => {
    const token = getToken()
    if (!token) return true
    const r = await saveCreatorOnboarding(token, {
      step: nextStep,
      identity,
      links,
      monetization,
      payout,
      completed,
    })
    return !!r.success
  }

  const next = async () => {
    if (step >= 4) {
      setSaving(true)
      const ok = await persist(4, true)
      setSaving(false)
      if (ok) { setDone(true); toast.success('Onboarding complete!') }
      else toast.error('Failed to save onboarding')
    } else {
      const ok = await persist(step + 1, false)
      if (ok) setStep(step + 1)
      else toast.error('Failed to save')
    }
  }

  const prev = () => { if (step > 1) setStep(step - 1) }

  if (loading) {
    return <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav"><div className="max-w-3xl mx-auto"><Skeleton variant="rect" className="h-80 rounded-xl" /></div></div>
  }

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Icon name="rocket_launch" className="w-7 h-7 text-primary-container" />
          <div>
            <h1 className="text-headline-md font-bold">Creator Onboarding</h1>
            <p className="text-on-surface-variant/60 text-xs mt-0.5">Set up your creator profile in a few steps</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto mb-6 pb-1">
          {NAV.map(n => (
            <button key={n.path} onClick={() => nav(n.path)} className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-colors ${loc.pathname === n.path ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'}`}>
              <Icon name={n.icon as any} size="sm" /> {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const n = i + 1
            const isActive = n === step
            const isDone = n < step || done
            return (
              <div key={s.title} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 ${isActive ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-primary-container text-on-primary-container' : isActive ? 'border-2 border-primary-container text-primary-container' : 'bg-white/10'}`}>
                    <Icon name={isDone && !isActive ? 'check' : s.icon} size="sm" />
                  </div>
                  <span className="text-xs hidden md:block font-medium">{s.title}</span>
                </div>
                {n < 4 && <div className={`h-0.5 flex-1 rounded ${isDone ? 'bg-primary-container' : 'bg-white/10'}`} />}
              </div>
            )
          })}
        </div>

        {done ? (
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-10 text-center">
            <Icon name="verified" className="w-14 h-14 text-primary-container mx-auto mb-4" />
            <h2 className="text-headline-md font-bold mb-2">You&apos;re all set!</h2>
            <p className="text-on-surface-variant text-sm mb-6">Your creator profile is complete. You can start uploading and going live.</p>
            <Button onClick={() => nav('/creator')}>Go to dashboard</Button>
          </div>
        ) : (
          <div className="bg-surface-container-high border border-white/5 rounded-xl p-7">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-label-md text-label-md text-on-surface">Your identity</h3>
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">Full name</label>
                  <Input value={identity.fullName} onChange={(e) => setIdentity(i => ({ ...i, fullName: e.target.value }))} placeholder="Your legal name" />
                </div>
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">Stage name</label>
                  <Input value={identity.stageName} onChange={(e) => setIdentity(i => ({ ...i, stageName: e.target.value }))} placeholder="How you appear to fans" />
                </div>
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">Bio</label>
                  <textarea value={identity.bio} onChange={(e) => setIdentity(i => ({ ...i, bio: e.target.value }))} rows={4} placeholder="Tell your audience about yourself…" className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container resize-none" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-label-md text-label-md text-on-surface">Social & links</h3>
                {(['website', 'instagram', 'youtube', 'tiktok'] as const).map(k => (
                  <div key={k}>
                    <label className="text-on-surface-variant text-sm mb-1.5 block capitalize">{k}</label>
                    <Input value={links[k]} onChange={(e) => setLinks(l => ({ ...l, [k]: e.target.value }))} placeholder={`${k} URL`} />
                  </div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-label-md text-label-md text-on-surface">Monetization</h3>
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">Revenue plan</label>
                  <select value={monetization.plan} onChange={(e) => setMonetization(m => ({ ...m, plan: e.target.value }))} className="w-full bg-surface-variant/20 border border-outline/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-container">
                    <option value="basic">Basic — PPM only</option>
                    <option value="plus">Plus — PPM + memberships</option>
                    <option value="premium">Premium — Full suite</option>
                  </select>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'memberships' as const, label: 'Enable memberships', desc: 'Let fans subscribe to support you' },
                    { key: 'adsOn' as const, label: 'Run ads on my content', desc: 'Earn extra from ad placements' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center justify-between bg-white/5 rounded-xl p-4 cursor-pointer">
                      <div>
                        <p className="text-sm text-on-surface">{opt.label}</p>
                        <p className="text-xs text-on-surface-variant/60">{opt.desc}</p>
                      </div>
                      <input type="checkbox" checked={monetization[opt.key]} onChange={(e) => setMonetization(m => ({ ...m, [opt.key]: e.target.checked }))} className="accent-primary w-5 h-5" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-label-md text-label-md text-on-surface">Payout details</h3>
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">Bank name</label>
                  <Input value={payout.bankName} onChange={(e) => setPayout(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. Access Bank" />
                </div>
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">Account number</label>
                  <Input value={payout.accountNumber} onChange={(e) => setPayout(p => ({ ...p, accountNumber: e.target.value }))} placeholder="10-digit account number" />
                </div>
                <div>
                  <label className="text-on-surface-variant text-sm mb-1.5 block">Account name</label>
                  <Input value={payout.accountName} onChange={(e) => setPayout(p => ({ ...p, accountName: e.target.value }))} placeholder="Full account name" />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 mt-6 border-t border-white/5">
              <Button variant="ghost" onClick={prev} disabled={step === 1}>Back</Button>
              <Button onClick={next} loading={saving}>{step >= 4 ? 'Finish' : 'Continue'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
