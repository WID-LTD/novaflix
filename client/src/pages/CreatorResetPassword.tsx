import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { creatorResetPassword } from '../lib/auth'
import DynamicChevronBackdrop from '../components/features/DynamicChevronBackdrop'

export default function CreatorResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const res = await creatorResetPassword(token, password)
    setLoading(false)
    if (res.success) {
      setDone(true)
    } else {
      setError(res.error || 'Failed to reset password')
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
          {!token ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4 text-error">
                <Icon name="link_off" size="lg" />
              </div>
              <p className="text-sm text-on-surface-variant mb-6">This reset link is invalid or malformed. Please request a new one.</p>
              <Link to="/creator/forgot-password" className="text-sm text-primary hover:underline">Request a new link</Link>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4 text-secondary">
                <Icon name="check_circle" size="lg" />
              </div>
              <p className="text-sm text-on-surface-variant mb-6">Your password has been reset successfully.</p>
              <Link to="/login" className="text-sm text-primary hover:underline">Go to Creator Sign In</Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-2">Choose a new password</h2>
              <p className="text-sm text-on-surface-variant mb-6">Make sure it's at least 6 characters.</p>

              {error && (
                <div className="text-sm p-3 rounded-xl mb-4 bg-primary-container/10 text-primary border border-primary-container/20">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-on-surface-variant mb-1.5 block">New Password</label>
                  <div className="relative">
                    <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="password" required placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-outline/20 rounded-xl pl-10 pr-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-on-surface-variant mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input type="password" required placeholder="Repeat new password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full bg-black/40 border border-outline/20 rounded-xl pl-10 pr-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/20 transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={loading || !password || !confirm} className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary-container/20">
                  {loading ? 'Please wait...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Back to Creator Sign In</Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
