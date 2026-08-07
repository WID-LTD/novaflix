import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { getPublicCreators } from '../lib/api'
import Perspective3DGridBackdrop from '../components/features/Perspective3DGridBackdrop'

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
  { icon: 'attach_money' as const, title: 'Monetize Your Work', desc: 'Earn from subscriptions, tips, and pay-per-view. Get paid what you deserve.' },
  { icon: 'group' as const, title: 'Build Your Audience', desc: 'Reach millions of viewers worldwide. Grow your fanbase with built-in tools.' },
  { icon: 'bar_chart' as const, title: 'Real-Time Analytics', desc: 'Track views, engagement, and revenue with a powerful dashboard.' },
  { icon: 'shield' as const, title: 'Full Creative Control', desc: 'You own your content. Set your own prices, schedule, and distribution.' },
  { icon: 'language' as const, title: 'Global Distribution', desc: 'Your films reach audiences across 190+ countries with instant translation.' },
  { icon: 'trending_up' as const, title: 'Smart Recommendations', desc: 'Our AI recommends your content to the right audience at the right time.' },
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
      <section className="relative overflow-hidden bg-black">
        <Perspective3DGridBackdrop />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-container/10 via-transparent to-transparent z-[1]" />
        <div className="relative z-[2] max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <motion.div {...fadeUp}>
            <Icon name="videocam" className="w-12 h-12 text-primary-container mx-auto mb-6" />
            <h1 className="text-display-sm font-bold text-on-surface mb-4">
              Unleash Your
              <span className="text-primary-container"> Creativity</span>
            </h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto mb-8">
              Join the next generation of filmmakers. Upload your films, build your audience,
              and earn revenue — all on your own terms.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/creator/login')}
              className="px-8 py-3 bg-primary-container text-on-primary-container rounded-xl font-semibold text-base hover:brightness-110 transition-all inline-flex items-center gap-2"
            >
              Start Creating <Icon name="arrow_forward" />
            </motion.button>
            <p className="text-on-surface-variant/40 text-xs mt-3">No upfront fees · 100% free to join</p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-white/5 bg-surface-container-high">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Active Creators', value: creators.length || '100+' },
            { label: 'Films Uploaded', value: '2,400+' },
            { label: 'Minutes Streamed', value: '1.2M+' },
            { label: 'Revenue Paid Out', value: '$50K+' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-on-surface">{s.value}</p>
              <p className="text-on-surface-variant/60 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Creators */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <motion.div {...fadeUp} className="text-center mb-12">
          <h2 className="text-display-sm font-bold text-on-surface mb-3">
            Meet Our <span className="text-primary-container">Creators</span>
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">
            From indie filmmakers to award-winning directors — discover the talent that makes <img src="/leter-mark-logo.png" alt="" className="h-4 w-auto inline align-middle" /> extraordinary.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-white/5 rounded-xl mb-3" />
                <div className="h-4 bg-white/5 rounded w-24 mb-2" />
                <div className="h-3 bg-white/5 rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div {...stagger} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-gutter">
            {creators.map((c) => (
              <motion.div
                key={c.id}
                variants={{ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/profile/${c.id}`)}
                className="group cursor-pointer"
              >
                <div className="aspect-[3/4] bg-surface-container-high border border-white/5 rounded-xl overflow-hidden mb-3 relative">
                  {c.avatar ? (
                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-container/10">
                      <Icon name="videocam" className="w-8 h-8 text-primary-container/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div className="flex items-center gap-2 text-xs text-white">
                      <Icon name="star" fill={true} className="text-primary-container" /> {c.total_likes || 0} likes
                    </div>
                  </div>
                </div>
                <p className="font-label-md text-label-md text-on-surface truncate">{c.name}</p>
                <p className="text-on-surface-variant/60 text-sm truncate">{c.known_for_department || 'Filmmaker'}</p>
                <p className="text-xs text-primary mt-1 inline-flex items-center gap-1">
                  <Icon name="group" className="w-3.5 h-3.5" /> {c.followers_count || 0} followers
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Why Join */}
      <section className="bg-surface-container-high border-y border-white/5 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-14">
            <h2 className="text-display-sm font-bold text-on-surface mb-3">
              Why Become a <span className="text-primary-container">Creator</span>?
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Everything you need to succeed as a filmmaker, all in one platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-gutter">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-surface-container border border-white/5 rounded-xl p-6 hover:border-primary-container/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center mb-4">
                  <Icon name={b.icon} className="text-primary-container" />
                </div>
                <h3 className="font-label-md text-label-md text-on-surface mb-2">{b.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <motion.div {...fadeUp} className="text-center mb-14">
          <h2 className="text-display-sm font-bold text-on-surface mb-3">
            How It <span className="text-primary-container">Works</span>
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">
            Get started in four simple steps.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-primary-container/40 via-primary-container/20 to-transparent" />
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container font-bold text-lg flex items-center justify-center mx-auto mb-4 relative z-10">
                {s.num}
              </div>
              <h3 className="font-label-md text-label-md text-on-surface mb-2">{s.title}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface-container-high border-y border-white/5 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-display-sm font-bold text-on-surface mb-3">
              What Creators <span className="text-primary-container">Say</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-gutter">
            {[
              { quote: '<img src="/leter-mark-logo.png" alt="" className="h-4 w-auto inline align-middle" /> gave me the freedom to distribute my short film globally. The analytics dashboard is a game-changer.', name: 'Scarlett Johansson', role: 'Actress & Producer' },
              { quote: 'I was able to monetize my content immediately. The platform\'s recommendation engine brought me thousands of new viewers.', name: 'Nicolas Cage', role: 'Academy Award Winner' },
              { quote: 'The creative control is unmatched. I set my own prices, keep my rights, and connect directly with my audience.', name: 'Tom Hanks', role: 'Filmmaker & Actor' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container border border-white/5 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Icon key={j} name="star" fill={true} className="text-primary-container" />
                  ))}
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="font-label-md text-label-md text-on-surface">{t.name}</p>
                  <p className="text-on-surface-variant/60 text-xs">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-container/15 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div {...fadeUp}>
            <Icon name="play_circle" className="w-10 h-10 text-primary-container mx-auto mb-4" />
            <h2 className="text-display-sm font-bold text-on-surface mb-4">
              Ready to Share Your <span className="text-primary-container">Story</span>?
            </h2>
            <p className="text-on-surface-variant text-body-md mb-8 max-w-lg mx-auto">
              Join hundreds of creators already making an impact on <img src="/leter-mark-logo.png" alt="" className="h-4 w-auto inline align-middle" />.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/creator/login')}
              className="px-8 py-3 bg-primary-container text-on-primary-container rounded-xl font-semibold text-base hover:brightness-110 transition-all inline-flex items-center gap-2"
            >
              Become a Creator <Icon name="arrow_forward" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
