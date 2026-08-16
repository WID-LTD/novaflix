import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'

const storeBadges = [
  { icon: 'smartphone' as const, name: 'Download on the', store: 'App Store', color: 'bg-black border-white/10', note: 'iOS 14+ · iPhone & iPad' },
  { icon: 'android' as const, name: 'Get it on', store: 'Google Play', color: 'bg-black border-white/10', note: 'Android 8.0+ · Phones & tablets' },
]

const highlights = [
  { icon: 'download' as const, title: 'Offline Downloads', desc: 'Save movies and shows for offline viewing — even at 4K.' },
  { icon: 'play_circle' as const, title: 'Seamless Casting', desc: 'Cast from your phone to TV with a single tap.' },
  { icon: 'notifications' as const, title: 'Smart Alerts', desc: 'Get notified when your favorites drop or go live.' },
  { icon: 'group' as const, title: 'Watch Parties', desc: 'Host watch parties right from your phone, anywhere.' },
]

export default function DownloadApp() {
  return (
    <div className="min-h-screen bg-surface text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-3">
            <img src="/leter-mark-logo.png" alt="" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Sign In</Link>
            <Link to="/login" className="text-sm bg-primary-container text-on-primary-container px-5 py-2 rounded-lg font-medium hover:brightness-110 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto relative grid md:grid-cols-2 gap-12 items-center text-left">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary-container bg-primary-container/10 border border-primary-container/30 px-3 py-1 rounded-full mb-6">
              <Icon name="smartphone" size="sm" /> Now available on iOS & Android
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight">
              Take Novaflix <span className="bg-gradient-to-r from-primary-container to-secondary bg-clip-text text-transparent">everywhere</span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-md">
              Stream on the go, download for offline, and cast to your TV. One account, all your devices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {storeBadges.map((b, i) => (
                <a
                  key={i}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-label={`${b.store} mock badge`}
                  className={`${b.color} border rounded-xl px-5 py-3 flex items-center gap-3 hover:border-primary-container/50 transition-colors`}
                >
                  <Icon name={b.icon} className="text-3xl text-white" />
                  <span className="text-left leading-tight">
                    <span className="block text-[11px] text-gray-400">{b.name}</span>
                    <span className="block text-lg font-semibold text-white">{b.store}</span>
                  </span>
                </a>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">Free download · Syncs your watchlist instantly · No ads in the app</p>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center md:justify-end">
            <div className="w-56 rounded-[2.5rem] border-[6px] border-gray-800 bg-black p-2 shadow-2xl shadow-accent/10">
              <div className="rounded-[2rem] overflow-hidden bg-gradient-to-b from-surface-container-high to-black aspect-[9/19]">
                <img src="/leter-mark-logo.png" alt="Novaflix" className="w-16 mx-auto mt-10" />
                <p className="text-center text-lg font-bold mt-3">Novaflix</p>
                <p className="text-center text-[11px] text-gray-500 mt-1">Stream. Download. Cast.</p>
                <div className="mt-6 px-4">
                  <div className="rounded-xl bg-surface-variant/30 h-40 mb-3 flex items-center justify-center">
                    <Icon name="play_circle" className="text-4xl text-primary-container" />
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-surface-variant/30 h-3 w-3/4" />
                    <div className="rounded-lg bg-surface-variant/30 h-3 w-1/2" />
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {['home', 'search', 'download', 'person'].map((ic) => (
                      <div key={ic} className="rounded-lg bg-surface-variant/30 h-8 flex items-center justify-center">
                        <Icon name={ic as 'home'} size="sm" className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-6 bg-surface-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Built for mobile</h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">Everything you love about Novaflix, optimized for your pocket.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((h, i) => (
              <div key={i} className="bg-surface-container-high border border-white/5 rounded-xl p-6 hover:border-primary-container/30 transition-all">
                <Icon name={h.icon} className="text-3xl mb-4 block text-primary-container" />
                <h3 className="text-lg font-semibold mb-2">{h.title}</h3>
                <p className="text-gray-400 text-sm">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to watch anywhere?</h2>
          <p className="text-gray-400 mb-8">Download the app today and start streaming in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="bg-primary-container text-on-primary-container px-8 py-3.5 rounded-xl font-semibold hover:brightness-110 transition-colors">Sign Up Free</Link>
            <Link to="/landing" className="bg-surface-variant/20 text-on-surface px-8 py-3.5 rounded-xl font-semibold hover:bg-surface-variant/40 transition-colors border border-outline/20">Back to Homepage</Link>
          </div>
        </div>
      </section>
    </div>
  )
}