import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import PremiumBadge from '../components/ui/PremiumBadge'
import { useAuth } from '../lib/AuthContext'
import { useStore } from '../store/useStore'
import { updateProfile, changePassword, deleteAccount, getUserStats, getPaymentStatus, getToken, getSettings, updateSettings } from '../lib/auth'
import { getDownloadDevices, removeDownloadDevice, type DownloadDevice } from '../lib/api'
import { getLocale, setLocale, type Locale } from '../i18n'

const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
]

export default function Settings() {
  const { user, planFeatures, planRank } = useAuth()
  const token = getToken()
  const playbackSettings = useStore((s) => s.playbackSettings)
  const notificationSettings = useStore((s) => s.notificationSettings)
  const updatePlaybackSettings = useStore((s) => s.updatePlaybackSettings)
  const updateNotificationSettings = useStore((s) => s.updateNotificationSettings)

  const [showLangPicker, setShowLangPicker] = useState(false)
  const [currentLang, setCurrentLang] = useState<Locale>(getLocale())

  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')
  const [showPwForm, setShowPwForm] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const [stats, setStats] = useState<any>(null)
  const [billing, setBilling] = useState<any>(null)

  // Download devices (registered in the mobile apps; managed here)
  const [dlDevices, setDlDevices] = useState<DownloadDevice[]>([])
  const [dlLimit, setDlLimit] = useState(0)
  const [removingDevice, setRemovingDevice] = useState<string | null>(null)

  // Debounce refs
  const settingsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSettings = useRef<{ playbackSettings?: any; notificationSettings?: any }>({})

  // WS for settings sync
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!token) return
    getUserStats(token).then(r => { if (r.success) setStats(r.stats) })
    getPaymentStatus(token).then(r => { if (r.success) setBilling(r) })
    getDownloadDevices().then(r => {
      if (r.success) {
        setDlDevices(r.devices || [])
        setDlLimit(r.limit ?? 0)
      }
    }).catch(() => {})
    getSettings(token).then(r => {
      if (r.success && r.settings) {
        const s = r.settings
        if (s.playbackSettings) updatePlaybackSettings(s.playbackSettings)
        if (s.notificationSettings) updateNotificationSettings(s.notificationSettings)
        // Hydrate locale from server settings
        if (s.locale) setCurrentLang(s.locale)
      }
    })
  }, [token])

  // WS for settings sync across devices
  useEffect(() => {
    if (!token) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws?token=${encodeURIComponent(token)}`)
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type === 'settings:updated' && data.settings) {
          const s = data.settings
          if (s.playbackSettings) updatePlaybackSettings(s.playbackSettings)
          if (s.notificationSettings) updateNotificationSettings(s.notificationSettings)
          if (s.locale) setCurrentLang(s.locale)
        }
      } catch {}
    }
    wsRef.current = ws
    return () => { ws.close() }
  }, [token])

  const hydrated = useRef(false)

  // Debounced settings save
  useEffect(() => {
    if (!hydrated.current) return
    if (!token) return
    const { playbackSettings: p, notificationSettings: n } = pendingSettings.current
    if (settingsSaveTimer.current) clearTimeout(settingsSaveTimer.current)
    settingsSaveTimer.current = setTimeout(() => {
      updateSettings(token, {
        playbackSettings: p ?? playbackSettings,
        notificationSettings: n ?? notificationSettings,
      })
      pendingSettings.current = {}
    }, 800)
    return () => { if (settingsSaveTimer.current) clearTimeout(settingsSaveTimer.current) }
  }, [playbackSettings, notificationSettings, token])

  useEffect(() => { hydrated.current = true }, [])

  const handleSaveProfile = async () => {
    if (!token) return
    setProfileSaving(true)
    setProfileMsg('')
    const res = await updateProfile(token, { name, bio })
    if (res.success) {
      setProfileMsg('Profile updated')
    } else {
      setProfileMsg(res.error || 'Failed to update')
    }
    setProfileSaving(false)
  }

  const handleChangePassword = async () => {
    setPwMsg('')
    setPwError('')
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    if (newPw.length < 6) { setPwError('Password must be at least 6 characters'); return }
    if (!token) return
    setPwSaving(true)
    const res = await changePassword(token, currentPw, newPw)
    if (res.success) {
      setPwMsg('Password updated')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } else {
      setPwError(res.error || 'Failed to update password')
    }
    setPwSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!token || deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    await deleteAccount(token)
    window.location.href = '/login'
  }

  const currentPlan = user?.plan || 'free'
  const planName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon name="settings" className="w-8 h-8 text-primary-container" />
          <h1 className="text-headline-lg font-bold">Settings</h1>
        </div>

        <div className="space-y-8">
          {/* Account */}
          <div>
            <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
              <Icon name="person" className="text-primary-container" /> Account
            </h2>
            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5 space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant/60 mb-1 block">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant/60 mb-1 block">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50 resize-none" />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant/60 mb-1 block">Email</label>
                <input value={user?.email || ''} disabled className="w-full bg-surface-container/50 border border-white/5 rounded-xl py-3 px-4 text-on-surface/50 outline-none cursor-not-allowed" />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleSaveProfile} disabled={profileSaving}>{profileSaving ? 'Saving...' : 'Save Profile'}</Button>
                {profileMsg && <span className={`text-sm ${profileMsg === 'Profile updated' ? 'text-green-400' : 'text-red-400'}`}>{profileMsg}</span>}
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div>
            <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
              <Icon name="workspace_premium" className="text-primary-container" /> Subscription
            </h2>
            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon name="workspace_premium" className="text-primary-container" />
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{planName} Plan</p>
                    <p className="text-on-surface-variant/60 text-sm">{planFeatures.maxResolution} · {planFeatures.concurrentScreens} screen{planFeatures.concurrentScreens > 1 ? 's' : ''} · {planFeatures.adFree ? 'Ad-free' : 'Ads'}</p>
                  </div>
                </div>
                <Link to="/pricing"><Button size="sm" variant="secondary">{planRank < 4 ? 'Upgrade' : 'Manage'}</Button></Link>
              </div>
              {stats?.subscription && (
                <div className="flex items-center gap-3 text-sm text-on-surface-variant/60">
                  <Icon name="check_circle" size="sm" className="text-green-400" />
                  Active since {new Date(stats.subscription.started_at).toLocaleDateString()}
                </div>
              )}
              {billing?.data?.subscriptions?.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-3 text-sm text-on-surface-variant/60">
                  <Icon name="receipt_long" size="sm" />
                  {sub.plan} — {sub.status}
                </div>
              ))}
              <Link to="/pricing" className="text-primary text-sm hover:underline inline-flex items-center gap-1">
                <Icon name="compare_arrows" size="sm" /> Compare Plans
              </Link>
            </div>
          </div>

          {/* Download devices — registered in the mobile apps */}
          {planRank >= 1 && (
            <div>
              <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
                <Icon name="download" className="text-primary-container" /> Download Devices
              </h2>
              <div className="bg-surface-container-high border border-white/5 rounded-xl p-5 space-y-3">
                <p className="text-body-sm text-on-surface-variant">
                  Offline downloads live in the NovaFlix mobile apps. Devices register automatically on first download.
                  <span className="text-on-surface font-medium"> {dlDevices.length} of {dlLimit} used</span> on your {planName} plan.
                </p>
                {dlDevices.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3 border border-outline/10">
                    <div className="min-w-0 flex items-center gap-3">
                      <Icon name={d.platform === 'ios' ? 'phone_iphone' : 'android'} className="text-on-surface-variant" />
                      <div className="min-w-0">
                        <p className="text-body-md text-on-surface truncate max-w-[260px]">{d.device_name || d.device_id.slice(0, 24)}</p>
                        <p className="text-body-sm text-on-surface-variant">Last used {new Date(d.last_used_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary"
                      loading={removingDevice === d.device_id}
                      onClick={async () => {
                        setRemovingDevice(d.device_id)
                        const res = await removeDownloadDevice(d.device_id)
                        if (res.success) setDlDevices(prev => prev.filter(x => x.device_id !== d.device_id))
                        setRemovingDevice(null)
                      }}>
                      Remove
                    </Button>
                  </div>
                ))}
                {dlDevices.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant/60">No devices registered yet. Download a title in the app to register this device.</p>
                )}
              </div>
            </div>
          )}

          {/* Security */}
          <div>
            <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
              <Icon name="lock" className="text-primary-container" /> Security
            </h2>
            <div className="bg-surface-container-high border border-white/5 rounded-xl p-5 space-y-4">
              {!showPwForm ? (
                <Button variant="secondary" onClick={() => setShowPwForm(true)}>
                  <Icon name="lock" size="sm" /> Change Password
                </Button>
              ) : (
                <div className="space-y-3">
                  <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50" />
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50" />
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" className="w-full bg-surface-container border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary-container/50" />
                  <div className="flex items-center gap-3">
                    <Button onClick={handleChangePassword} disabled={pwSaving || !currentPw || !newPw || !confirmPw}>{pwSaving ? 'Saving...' : 'Update Password'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setShowPwForm(false); setPwMsg(''); setPwError('') }}>Cancel</Button>
                  </div>
                  {pwMsg && <p className="text-sm text-green-400">{pwMsg}</p>}
                  {pwError && <p className="text-sm text-red-400">{pwError}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
              <Icon name="palette" className="text-primary-container" /> Appearance
            </h2>
            <div className="bg-surface-container-high border border-white/5 rounded-xl divide-y divide-outline/10">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Icon name="language" className="text-on-surface-variant" />
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{locales.find(l => l.code === currentLang)?.label}</p>
                    <p className="text-on-surface-variant/60 text-sm">Language</p>
                  </div>
                </div>
                <button onClick={() => setShowLangPicker(!showLangPicker)} className="p-2 rounded-lg hover:bg-white/5"><Icon name="chevron_right" className="text-on-surface-variant/40" /></button>
              </div>
              {showLangPicker && (
                <div className="px-5 py-3 space-y-1">
                  {locales.map(loc => (
                    <button key={loc.code} onClick={() => { setLocale(loc.code); setCurrentLang(loc.code); setShowLangPicker(false); if (token) updateSettings(token, { locale: loc.code }) }} className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm hover:bg-white/5 ${currentLang === loc.code ? 'text-primary' : 'text-on-surface-variant'}`}>
                      <span>{loc.label}</span>
                      {currentLang === loc.code && <Icon name="check" className="text-primary" size="sm" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Playback */}
          <div>
            <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
              <Icon name="play_circle" className="text-primary-container" /> Playback
            </h2>
            <div className="bg-surface-container-high border border-white/5 rounded-xl divide-y divide-outline/10">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Icon name="hd" className="text-on-surface-variant" />
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Default Quality</p>
                    <p className="text-on-surface-variant/60 text-sm">{playbackSettings.defaultQuality}</p>
                  </div>
                </div>
                <select value={playbackSettings.defaultQuality} onChange={e => { const v = e.target.value as 'auto' | '720p' | '1080p' | '4k'; updatePlaybackSettings({ defaultQuality: v }); pendingSettings.current.playbackSettings = { ...playbackSettings, defaultQuality: v } }} className="bg-surface-container border border-white/10 rounded-lg py-2 px-3 text-on-surface text-sm outline-none">
                  <option value="auto">Auto</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4k">4K</option>
                </select>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Icon name="autorenew" className="text-on-surface-variant" />
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Autoplay</p>
                    <p className="text-on-surface-variant/60 text-sm">Next episode automatically</p>
                  </div>
                </div>
                <button onClick={() => { const v = !playbackSettings.autoplay; updatePlaybackSettings({ autoplay: v }); pendingSettings.current.playbackSettings = { ...playbackSettings, autoplay: v } }} className={`w-12 h-6 rounded-full transition-colors ${playbackSettings.autoplay ? 'bg-primary-container' : 'bg-white/20'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${playbackSettings.autoplay ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
              <Icon name="notifications" className="text-primary-container" /> Notifications
            </h2>
            <div className="bg-surface-container-high border border-white/5 rounded-xl divide-y divide-outline/10">
              {[
                { key: 'newReleases' as const, label: 'New Releases', desc: 'Get notified about new content', icon: 'notifications_active' as const },
                { key: 'watchlistUpdates' as const, label: 'Watchlist Updates', desc: 'When items change', icon: 'notifications' as const },
                { key: 'creatorActivity' as const, label: 'Creator Activity', desc: 'Updates from creators you follow', icon: 'campaign' as const },
                { key: 'marketing' as const, label: 'Marketing', desc: 'Promotions and offers', icon: 'local_offer' as const },
              ].map(({ key, label, desc, icon }) => (
                <div key={key} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Icon name={icon} className="text-on-surface-variant" />
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">{label}</p>
                      <p className="text-on-surface-variant/60 text-sm">{desc}</p>
                    </div>
                  </div>
                  <button onClick={() => { const v = !notificationSettings[key]; updateNotificationSettings({ [key]: v }); pendingSettings.current.notificationSettings = { ...notificationSettings, [key]: v } }} className={`w-12 h-6 rounded-full transition-colors ${notificationSettings[key] ? 'bg-primary-container' : 'bg-white/20'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notificationSettings[key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
              <Icon name="bookmark" className="text-primary-container" /> Your Library
            </h2>
            <div className="bg-surface-container-high border border-white/5 rounded-xl divide-y divide-outline/10">
              {[
                { to: '/watchlist', icon: 'bookmark' as const, label: 'Watchlist' },
                { to: '/profile', icon: 'person' as const, label: 'Profile' },
                { to: '/home', icon: 'play_circle' as const, label: 'Continue Watching' },
                { to: '/referrals', icon: 'share' as const, label: 'Refer & Earn' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon name={item.icon} className="text-on-surface-variant" />
                    <p className="font-label-md text-label-md text-on-surface">{item.label}</p>
                  </div>
                  <Icon name="chevron_right" className="text-on-surface-variant/40" />
                </Link>
              ))}
            </div>
          </div>

          {/* Creator Tools */}
          {user?.role === 'creator' || user?.role === 'admin' ? (
            <div>
              <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
                <Icon name="bar_chart" className="text-primary-container" /> Creator Tools
              </h2>
              <div className="bg-surface-container-high border border-white/5 rounded-xl divide-y divide-outline/10">
                  {[
                    { to: '/upload', icon: 'cloud_upload' as const, label: 'Upload Film' },
                    { to: '/learn', icon: 'school' as const, label: 'E-Learning' },
                    { to: '/store', icon: 'storefront' as const, label: 'Merch Store' },
                  ].map(item => (
                  <Link key={item.to} to={item.to} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon name={item.icon} className="text-on-surface-variant" />
                      <p className="font-label-md text-label-md text-on-surface">{item.label}</p>
                    </div>
                    <Icon name="chevron_right" className="text-on-surface-variant/40" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {/* Danger Zone */}
          <div>
            <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-red-400 uppercase tracking-widest">
              <Icon name="warning" className="text-red-400" /> Danger Zone
            </h2>
            <div className="bg-surface-container-high border border-red-400/20 rounded-xl p-5">
              {!showDeleteConfirm ? (
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(true)} className="border-red-400/30 text-red-400 hover:bg-red-400/10">
                  <Icon name="delete_forever" size="sm" /> Delete Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-400">This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.</p>
                  <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE" className="w-full bg-surface-container border border-red-400/30 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-red-400/50" />
                  <div className="flex items-center gap-3">
                    <Button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleting} className="bg-red-600 text-white hover:bg-red-700">{deleting ? 'Deleting...' : 'Permanently Delete'}</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
