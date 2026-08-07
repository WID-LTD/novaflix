import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { creatorRegister, creatorLogin, creatorLoginVerify, setToken } from '../lib/auth'
import DynamicChevronBackdrop from '../components/features/DynamicChevronBackdrop'

export default function CreatorLogin() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerify, setNeedsVerify] = useState(false)
  const [verifyReason, setVerifyReason] = useState<'new-device' | 'inactive' | 'unknown-location'>('new-device')
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const navigate = useNavigate()

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
        if (res.success && res.needsLoginVerification && res.userId) {
          setPendingUserId(res.userId)
          setVerifyReason((res.reason as any) || 'new-device')
          setNeedsVerify(true)
          setLoading(false)
          return
        }
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

  async function handleVerify() {
    if (!pendingUserId) return
    setError('')
    setVerifying(true)
    const res = await creatorLoginVerify(pendingUserId, code)
    setVerifying(false)
    if (res.success && res.token && res.user) {
      setToken(res.token)
      navigate('/creator', { replace: true })
    } else {
      setError(res.error || 'Invalid code')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface">
      <DynamicChevronBackdrop />

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
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container/10 mb-4 ring-1 ring-primary-container/20">
            <Icon name="videocam" className="w-8 h-8 text-primary-container" />
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-headline-md font-bold"
          >
            Nova<span className="text-primary-container">Flix</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-on-surface-variant mt-1"
          >
            Creator Hub
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8"
        >
          <div className="flex mb-6 bg-black/40 border border-white/5 rounded-xl p-1">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'login' ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/30' : 'text-on-surface-variant hover:text-on-surface'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'register' ? 'bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/30' : 'text-on-surface-variant hover:text-on-surface'}`}>Sign Up</button>
          </div>

          {error && (
            <div className={`text-sm p-3 rounded-xl mb-4 ${error.includes('created') ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-primary-container/10 text-primary border border-primary-container/20'}`}>
              {error}
            </div>
          )}

          {needsVerify && (
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold mb-1">Confirm it's you</h2>
              <p className="text-sm text-on-surface-variant mb-4">
                {verifyReason === 'new-device' && 'We noticed a sign-in from a new device or network.'}
                {verifyReason === 'inactive' && "You haven't signed in for a while, so we want to confirm it's you."}
                {verifyReason === 'unknown-location' && 'We noticed a sign-in from an unfamiliar location.'}
                {' '}A code was sent to <span className="text-primary">{email}</span>.
              </p>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                className="w-full bg-black/40 border border-outline/20 rounded-xl py-3 px-4 text-center text-2xl tracking-[0.5em] font-bold text-on-surface focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/20 transition-all mb-4"
              />
              <button onClick={handleVerify} disabled={code.length !== 6 || verifying} className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary-container/20">
                {verifying ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </div>
          )}

          {!needsVerify && <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm text-on-surface-variant mb-1.5 block">Display Name</label>
                <input type="text" placeholder="Your creator name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-outline/20 rounded-xl px-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/20 transition-all" />
              </div>
            )}
            <div>
              <label className="text-sm text-on-surface-variant mb-1.5 block">Email</label>
              <div className="relative">
                <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-outline/20 rounded-xl pl-10 pr-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/20 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-sm text-on-surface-variant mb-1.5 block">Password</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input type="password" required placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-outline/20 rounded-xl pl-10 pr-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/20 transition-all" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <button type="submit" disabled={loading} className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary-container/20">
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In as Creator' : 'Create Creator Account'}
              </button>
            </div>
            {mode === 'login' && (
              <div className="text-center">
                <Link to="/creator/forgot-password" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Forgot password?</Link>
              </div>
            )}
          </form>}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Regular user login →</Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
