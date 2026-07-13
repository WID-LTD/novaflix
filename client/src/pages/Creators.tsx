import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Film, DollarSign, Users, BarChart3, Star, ArrowRight,
  Camera, Shield, TrendingUp, Globe, CheckCircle, Play,
} from 'lucide-react'
import { getPublicCreators } from '../lib/api'

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6 },
}

const stagger = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { staggerChildren: 0.1, delayChildren: 0.2 },
}

const benefits = [
  { icon: DollarSign, title: 'Monetize Your Work', desc: 'Earn from subscriptions, tips, and pay-per-view. Get paid what you deserve.' },
  { icon: Users, title: 'Build Your Audience', desc: 'Reach millions of viewers worldwide. Grow your fanbase with built-in tools.' },
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Track views, engagement, and revenue with a powerful dashboard.' },
  { icon: Shield, title: 'Full Creative Control', desc: 'You own your content. Set your own prices, schedule, and distribution.' },
  { icon: Globe, title: 'Global Distribution', desc: 'Your films reach audiences across 190+ countries with instant translation.' },
  { icon: TrendingUp, title: 'Smart Recommendations', desc: 'Our AI recommends your content to the right audience at the right time.' },
]

const steps = [
  { num: '01', title: 'Create Your Account', desc: 'Sign up as a creator in minutes. No upfront fees, no contracts.' },
  { num: '02', title: 'Upload Your Film', desc: 'Drag and drop your masterpiece. We handle encoding, hosting, and delivery.' },
  { num: '03', title: 'Set Your Terms', desc: 'Choose free, premium, or pay-per-view. You decide how to monetize.' },
  { num: '04', title: 'Connect & Earn', desc: 'Share with your audience, track your earnings, and withdraw anytime.' },
]

export default function Creators() {
  const navigate = useNavigate()
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublicCreators().then(r => {
      if (r.success) setCreators(r.creators)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-black via-[#0a0a0a] to-surface">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <motion.div {...fadeUp}>
            <Camera className="w-12 h-12 text-accent mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Unleash Your
              <span className="text-accent"> Creativity</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              Join the next generation of filmmakers. Upload your films, build your audience,
              and earn revenue — all on your own terms.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/creator/login')}
              className="px-8 py-3 bg-accent text-white rounded-xl font-semibold text-base hover:bg-red-700 transition-colors inline-flex items-center gap-2"
            >
              Start Creating <ArrowRight className="w-4 h-4" />
            </motion.button>
            <p className="text-xs text-gray-600 mt-3">No upfront fees · 100% free to join</p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/5 bg-surface-card">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Active Creators', value: creators.length || '100+' },
            { label: 'Films Uploaded', value: '2,400+' },
            { label: 'Minutes Streamed', value: '1.2M+' },
            { label: 'Revenue Paid Out', value: '$50K+' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Creators */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Meet Our <span className="text-accent">Creators</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            From indie filmmakers to award-winning directors — discover the talent that makes NovaFlix extraordinary.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-white/5 rounded-2xl mb-3" />
                <div className="h-4 bg-white/5 rounded w-24 mb-2" />
                <div className="h-3 bg-white/5 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {creators.map((c, i) => (
              <motion.div
                key={c.id}
                variants={{ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[3/4] bg-surface-card border border-white/10 rounded-2xl overflow-hidden mb-3 relative">
                  {c.avatar ? (
                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent/10">
                      <Camera className="w-8 h-8 text-accent/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="flex items-center gap-2 text-xs text-white">
                      <Star className="w-3 h-3 fill-accent text-accent" /> {c.total_likes || 0} likes
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-white truncate">{c.name}</p>
                <p className="text-xs text-gray-500 truncate">{c.known_for_department || 'Filmmaker'}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Why Join */}
      <section className="bg-surface-card border-y border-white/5 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Why Become a <span className="text-accent">Creator</span>?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Everything you need to succeed as a filmmaker, all in one platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-accent/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            How It <span className="text-accent">Works</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Get started in four simple steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-accent/40 via-accent/20 to-transparent" />
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className="w-12 h-12 rounded-full bg-accent text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 relative z-10">
                {s.num}
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface-card border-y border-white/5 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              What Creators <span className="text-accent">Say</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'NovaFlix gave me the freedom to distribute my short film globally. The analytics dashboard is a game-changer.', name: 'Scarlett Johansson', role: 'Actress & Producer' },
              { quote: 'I was able to monetize my content immediately. The platform\'s recommendation engine brought me thousands of new viewers.', name: 'Nicolas Cage', role: 'Academy Award Winner' },
              { quote: 'The creative control is unmatched. I set my own prices, keep my rights, and connect directly with my audience.', name: 'Tom Hanks', role: 'Filmmaker & Actor' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-white/5 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/15 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div {...fadeUp}>
            <Play className="w-10 h-10 text-accent mx-auto mb-4" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Ready to Share Your <span className="text-accent">Story</span>?
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
              Join hundreds of creators already making an impact on NovaFlix.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/creator/login')}
              className="px-8 py-3 bg-accent text-white rounded-xl font-semibold text-base hover:bg-red-700 transition-colors inline-flex items-center gap-2"
            >
              Become a Creator <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
