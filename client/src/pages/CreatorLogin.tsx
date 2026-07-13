import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Film, Mail, Lock } from 'lucide-react'
import { creatorRegister, creatorLogin, setToken } from '../lib/auth'
import { getDetails, searchMedia } from '../lib/api'

export default function CreatorLogin() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [backdrop, setBackdrop] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    searchMedia('cinematography', 'movie').then(async (res) => {
      if (!res.success || !res.data.length) return
      const pick = res.data[Math.floor(Math.random() * Math.min(res.data.length, 10))]
      const detail = await getDetails(String(pick.id), 'movie')
      if (detail.success && detail.data.backdrop) {
        setBackdrop(detail.data.backdrop)
      }
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const res = await creatorRegister(email, password, name)
        if (res.success && res.userId) {
          setMode('login')
          setError('Account created! Check your email for verification, then sign in.')
          setLoading(false)
          return
        }
        setError(res.error || 'Registration failed')
      } else {
        const res = await creatorLogin(email, password)
        if (res.success && res.token && res.user) {
          setToken(res.token)
          navigate('/creator', { replace: true })
          return
        }
        setError(res.error || 'Login failed')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  const bgStyle = backdrop ? { backgroundImage: `url(${backdrop})` } : {}

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface">
      <div
        className="absolute inset-0 bg-cover bg-center scale-110 transition-opacity duration-1000"
        style={{ ...bgStyle, opacity: backdrop ? 0.35 : 0 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-surface/50 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md px-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4 ring-1 ring-accent/20">
            <Film className="w-8 h-8 text-accent" />
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold"
          >
            Nova<span className="text-accent">Flix</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 mt-1"
          >
            Creator Hub
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 ring-1 ring-accent/20 shadow-2xl shadow-accent/5"
        >
          <div className="flex mb-6 bg-black/40 border border-white/5 rounded-xl p-1">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'login' ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-gray-400 hover:text-white'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'register' ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-gray-400 hover:text-white'}`}>Sign Up</button>
          </div>

          {error && (
            <div className={`text-sm p-3 rounded-xl mb-4 ${error.includes('created') ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Display Name</label>
                <input type="text" placeholder="Your creator name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
            )}
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="password" required placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-accent text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-accent/20">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In as Creator' : 'Create Creator Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-accent transition-colors">Regular user login →</Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
