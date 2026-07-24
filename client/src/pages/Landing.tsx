import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useAuth } from '../lib/AuthContext'
import { subscribeNewsletter } from '../lib/auth'

const features = [
  { icon: 'play_circle' as const, title: 'Unlimited Streaming', desc: 'Watch thousands of movies and TV shows on any device, anytime.' },
  { icon: 'auto_awesome' as const, title: 'Personalized Picks', desc: 'Smart recommendations tailored to your taste and watch history.' },
  { icon: 'group' as const, title: 'Watch Parties', desc: 'Watch together in real-time with friends — built-in chat and sync.' },
  { icon: 'videocam' as const, title: 'Creator Hub', desc: 'Upload your films, earn revenue, and build your audience.', link: '/creators' },
  { icon: 'download' as const, title: 'Smart Downloads', desc: 'Download to watch offline. Choose quality or let our algorithm decide.' },
  { icon: 'language' as const, title: 'Global Library', desc: 'Curated films from around the world, from indie gems to blockbusters.' },
]

const plans = [
  { name: 'Free', price: '$0', period: 'forever', color: 'from-gray-600 to-gray-800', features: ['720p streaming', 'Ad-supported', 'Basic search', 'Create watchlist'] },
  { name: 'Premium', price: '$9.99', period: '/month', color: 'from-accent to-red-600', featured: true, features: ['4K HDR streaming', 'No ads', 'Offline downloads', 'Watch parties', 'Priority support'] },
  { name: 'Duo', price: '$14.99', period: '/month', color: 'from-accent to-yellow-600', features: ['Everything in Premium', '2 simultaneous streams', 'Shared watchlist', 'Family-friendly mode'] },
]

const testimonials = [
  { name: 'Alex R.', role: 'Film Buff', text: 'The recommendation engine is uncanny. I discover movies I never knew I needed.' },
  { name: 'Sarah K.', role: 'Indie Filmmaker', text: 'Uploading my short film and getting real analytics was a game-changer.' },
  { name: 'Marcus J.', role: 'Creator', text: 'Finally a platform that pays creators based on actual watch time, not one-time fees.' },
]

export default function Landing() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate('/home', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) return null
  if (user) return null

  return (
    <div className="min-h-screen bg-surface text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/leter-mark-logo.png" alt="" className="h-7 w-auto" />
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors">Sign In</Link>
            <Link to="/login" className="text-sm bg-primary-container text-on-primary-container px-5 py-2 rounded-lg font-medium hover:brightness-110 transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Premium Streaming for{' '}
            <span className="bg-gradient-to-r from-primary-container to-secondary bg-clip-text text-transparent">Everyone</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Discover thousands of movies, TV shows, and exclusive creator content. Watch anywhere, anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="bg-primary-container text-on-primary-container px-8 py-3.5 rounded-xl font-semibold text-lg hover:brightness-110 transition-colors">Start Free Trial</Link>
            <a href="#features" className="bg-surface-variant/20 text-on-surface px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-surface-variant/40 transition-colors border border-outline/20">Explore Features</a>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required. Free plan available forever.</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">Built for viewers, creators, and everyone in between.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Wrapper = f.link ? Link : 'div'
              return (
                <Wrapper key={i} to={f.link || ''} className={`bg-surface-container-high border border-white/5 rounded-xl p-6 hover:border-primary-container/30 transition-all group ${f.link ? 'cursor-pointer' : ''}`}>
                  <Icon name={f.icon} className="text-3xl mb-4 block text-primary-container" />
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm">{f.desc}</p>
                </Wrapper>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-surface-secondary/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">Choose the plan that fits you. Upgrade anytime.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((p, i) => (
              <div key={i} className={`relative bg-surface-container-high border ${p.featured ? 'border-primary-container/50 ring-1 ring-primary-container/30' : 'border-white/5'} rounded-xl p-8`}>
                {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary-container text-xs font-semibold px-4 py-1 rounded-full">Most Popular</span>}
                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-gray-400 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={`block text-center w-full py-3 rounded-xl font-semibold text-sm transition-colors ${p.featured ? 'bg-primary-container text-on-primary-container hover:brightness-110' : 'bg-surface-variant/20 text-on-surface hover:bg-surface-variant/40 border border-outline/20'}`}>
                  {p.name === 'Free' ? 'Get Started' : 'Subscribe'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Loved by viewers and creators</h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">Hear from the <img src="/leter-mark-logo.png" alt="" className="h-4 w-auto inline align-middle" /> community.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-surface-secondary border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  {[1,2,3,4,5].map(s => <Icon key={s} name="star" fill={true} className="text-primary-container" />)}
                </div>
                <p className="text-gray-300 text-sm mb-6 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-6 bg-surface-secondary/30">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Stay in the loop</h2>
          <p className="text-gray-400 text-sm mb-6">Get the latest movies, creator highlights, and platform updates.</p>
          <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await subscribeNewsletter(fd.get('email') as string); alert('Subscribed!') }} className="flex gap-3">
            <input name="email" type="email" required placeholder="your@email.com" className="flex-1 bg-surface-variant/20 border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50" />
            <button type="submit" className="bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-colors whitespace-nowrap">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="/leter-mark-logo.png" alt="" className="h-6 w-auto" />
          <p className="text-gray-500 text-xs">&copy; 2026 <img src="/leter-mark-logo.png" alt="" className="h-3 w-auto inline align-middle" />. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/creators" className="hover:text-white transition-colors">Creators</Link>
            <Link to="/creator/login" className="hover:text-white transition-colors">Creator Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
