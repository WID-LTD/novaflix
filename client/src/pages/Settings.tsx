import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import PremiumBadge from '../components/ui/PremiumBadge'
import { getLocale, setLocale, t, type Locale } from '../i18n'

interface SectionItem {
  label: string
  description: string
  icon: string
  link?: string
}

const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
]

const sections: { title: string; icon: string; items: SectionItem[] }[] = [
  {
    title: 'Subscription',
    icon: 'workspace_premium' as const,
    items: [
      { label: 'Current Plan', description: 'Free tier — 720p, ad-supported', icon: 'workspace_premium' as const, link: '/pricing' },
      { label: 'Billing History', description: 'No payment history', icon: 'receipt_long' as const },
      { label: 'Compare Plans', description: 'See what Premium offers', icon: 'compare_arrows' as const, link: '/pricing' },
    ],
  },
  {
    title: 'Appearance',
    icon: 'palette' as const,
    items: [
      { label: 'Theme', description: 'Dark mode (default)', icon: 'dark_mode' as const },
      { label: 'Language', description: 'English', icon: 'language' as const },
      { label: 'Accessibility', description: 'Reduced motion, contrast', icon: 'accessibility_new' as const },
    ],
  },
  {
    title: 'Playback',
    icon: 'play_circle' as const,
    items: [
      { label: 'Subtitle Preferences', description: 'Font size, color, background', icon: 'subtitles' as const },
      { label: 'Default Quality', description: 'Auto (recommended)', icon: 'hd' as const },
      { label: 'Autoplay', description: 'Next episode automatically', icon: 'autorenew' as const },
    ],
  },
  {
    title: 'Notifications',
    icon: 'notifications' as const,
    items: [
      { label: 'New Releases', description: 'Get notified about new content', icon: 'notifications_active' as const },
      { label: 'Watchlist Updates', description: 'When items change', icon: 'notifications' as const },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: 'shield' as const,
    items: [
      { label: 'Privacy', description: 'Data collection preferences', icon: 'shield' as const },
      { label: 'Security', description: 'Account security settings', icon: 'lock' as const },
    ],
  },
  {
    title: 'Your Library',
    icon: 'bookmark' as const,
    items: [
      { label: 'Watchlist', description: 'Movies & shows you saved', icon: 'bookmark' as const, link: '/watchlist' },
      { label: 'Profile', description: 'Manage your profile', icon: 'person' as const, link: '/profile' },
      { label: 'Continue Watching', description: 'Pick up where you left off', icon: 'play_circle' as const, link: '/home' },
      { label: 'Refer & Earn', description: 'Invite friends, earn rewards', icon: 'share' as const, link: '/referrals' },
    ],
  },
  {
    title: 'Creator Tools',
    icon: 'bar_chart' as const,
    items: [
      { label: 'Creator Dashboard', description: 'Analytics & revenue', icon: 'bar_chart' as const, link: '/creator' },
      { label: 'Upload Film', description: 'Share your work', icon: 'cloud_upload' as const, link: '/upload' },
      { label: 'E-Learning', description: 'Filmmaking courses', icon: 'school' as const, link: '/learn' },
      { label: 'Merch Store', description: 'Sell branded gear', icon: 'storefront' as const, link: '/store' },
    ],
  },
]

export default function Settings() {
  const [showLangPicker, setShowLangPicker] = useState(false)
  const currentLang = getLocale()

  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Icon name="settings" className="w-8 h-8 text-primary-container" />
          <h1 className="text-headline-lg font-bold">{t('settings.title')}</h1>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-label-md text-label-md mb-3 flex items-center gap-2 text-on-surface-variant uppercase tracking-widest">
                <Icon name={section.icon} className="text-primary-container" />
                {section.title}
              </h2>
              <div className="bg-surface-container-high border border-white/5 rounded-xl divide-y divide-outline/10">
                {section.items.map((item) => {
                  const isLang = item.label === 'Language'
                  const isPlan = item.label === 'Current Plan'
                  const content = (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon name={item.icon} className="text-on-surface-variant" />
                        <div>
                          <p className="font-label-md text-label-md text-on-surface">
                            {isLang ? locales.find((l) => l.code === currentLang)?.label : item.label}
                          </p>
                          <p className="text-on-surface-variant/60 text-sm">
                            {isLang ? locales.find((l) => l.code === currentLang)?.label : item.description}
                          </p>
                        </div>
                      </div>
                      <Icon name="chevron_right" className="text-on-surface-variant/40" />
                    </>
                  )
                  if (isLang) {
                    return (
                      <button key={item.label} onClick={() => setShowLangPicker(!showLangPicker)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left">
                        {content}
                      </button>
                    )
                  }
                  if (isPlan) {
                    return (
                      <Link key={item.label} to={item.link!} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <Icon name="workspace_premium" className="text-primary-container" />
                          <div>
                            <p className="font-label-md text-label-md text-on-surface">{item.label}</p>
                            <p className="text-on-surface-variant/60 text-sm">{item.description}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="secondary">Upgrade</Button>
                      </Link>
                    )
                  }
                  return item.link ? (
                    <Link key={item.label} to={item.link} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left">
                      {content}
                    </Link>
                  ) : (
                    <button key={item.label} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left">
                      {content}
                    </button>
                  )
                })}
              </div>
              {showLangPicker && (
                <div className="mt-2 bg-surface-container-high border border-white/5 rounded-xl overflow-hidden">
                  {locales.map((loc) => (
                    <button
                      key={loc.code}
                      onClick={() => {
                        setLocale(loc.code)
                        setShowLangPicker(false)
                        window.location.reload()
                      }}
                      className={`w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-white/5 transition-colors ${currentLang === loc.code ? 'text-primary' : 'text-on-surface-variant'}`}
                    >
                      <span>{loc.label}</span>
                      {currentLang === loc.code && <Icon name="check" className="text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-surface-container-high border border-primary-container/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <PremiumBadge size="lg" />
            <div className="flex-1">
              <h3 className="font-label-md text-label-md text-on-surface">Go Premium</h3>
              <p className="text-on-surface-variant/60 text-sm">4K HDR • Offline • No ads</p>
            </div>
            <Link to="/pricing">
              <Button size="sm">
                <Icon name="workspace_premium" fill={true} /> Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
