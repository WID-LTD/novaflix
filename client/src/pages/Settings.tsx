import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings as SettingsIcon, Monitor, Globe, Eye, Subtitles, Play, Bell, Shield, User, Crown, BarChart3, Upload, ShoppingBag, BookOpen, Check } from 'lucide-react'
import Button from '../components/ui/Button'
import PremiumBadge from '../components/ui/PremiumBadge'
import { getLocale, setLocale, t, type Locale } from '../i18n'

const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
]

const sections = [
  {
    title: 'Subscription',
    icon: Crown,
    items: [
      { label: 'Current Plan', description: 'Free tier — 720p, ad-supported', icon: Crown, link: '/pricing' },
      { label: 'Billing History', description: 'No payment history', icon: Crown },
      { label: 'Compare Plans', description: 'See what Premium offers', icon: Crown, link: '/pricing' },
    ],
  },
  {
    title: 'Appearance',
    icon: Monitor,
    items: [
      { label: 'Theme', description: 'Dark mode (default)', icon: Monitor },
      { label: 'Language', description: 'English', icon: Globe },
      { label: 'Accessibility', description: 'Reduced motion, contrast', icon: Eye },
    ],
  },
  {
    title: 'Playback',
    icon: Play,
    items: [
      { label: 'Subtitle Preferences', description: 'Font size, color, background', icon: Subtitles },
      { label: 'Default Quality', description: 'Auto (recommended)', icon: Monitor },
      { label: 'Autoplay', description: 'Next episode automatically', icon: Play },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      { label: 'New Releases', description: 'Get notified about new content', icon: Bell },
      { label: 'Watchlist Updates', description: 'When items change', icon: Bell },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: Shield,
    items: [
      { label: 'Privacy', description: 'Data collection preferences', icon: Shield },
      { label: 'Security', description: 'Account security settings', icon: Shield },
    ],
  },
  {
    title: 'Account',
    icon: User,
    items: [
      { label: 'Profile', description: 'Manage your profile', icon: User },
    ],
  },
  {
    title: 'Creator Tools',
    icon: BarChart3,
    items: [
      { label: 'Creator Dashboard', description: 'Analytics & revenue', icon: BarChart3, link: '/creator' },
      { label: 'Upload Film', description: 'Share your work', icon: Upload, link: '/upload' },
      { label: 'E-Learning', description: 'Filmmaking courses', icon: BookOpen, link: '/learn' },
      { label: 'Merch Store', description: 'Sell branded gear', icon: ShoppingBag, link: '/store' },
    ],
  },
]

export default function Settings() {
  const [showLangPicker, setShowLangPicker] = useState(false)
  const currentLang = getLocale()

  return (
    <div className="min-h-screen px-4 md:px-8 pt-6 md:pt-10 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="w-8 h-8 text-accent" />
          <h1 className="text-3xl md:text-section font-bold">{t('settings.title')}</h1>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <section.icon className="w-5 h-5 text-accent" />
                {section.title}
              </h2>
              <div className="bg-surface-card border border-white/10 rounded-2xl divide-y divide-white/5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isLang = item.label === 'Language'
                  const content = (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isLang ? locales.find((l) => l.code === currentLang)?.label : item.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-500 text-sm">→</span>
                    </>
                  )
                  if (isLang) {
                    return (
                      <button key={item.label} onClick={() => setShowLangPicker(!showLangPicker)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors text-left">
                        {content}
                      </button>
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
                <div className="mt-2 bg-surface-card border border-white/10 rounded-xl overflow-hidden">
                  {locales.map((loc) => (
                    <button
                      key={loc.code}
                      onClick={() => {
                        setLocale(loc.code)
                        setShowLangPicker(false)
                        window.location.reload()
                      }}
                      className={`w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-white/5 transition-colors ${currentLang === loc.code ? 'text-accent' : 'text-gray-300'}`}
                    >
                      <span>{loc.label}</span>
                      {currentLang === loc.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-r from-premium/10 to-premium/5 border border-premium/20 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <PremiumBadge size="lg" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">Go Premium</h3>
              <p className="text-sm text-gray-400">4K HDR • Offline • No ads</p>
            </div>
            <Link to="/pricing">
              <Button size="sm">
                <Crown className="w-4 h-4 fill-current" /> Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
