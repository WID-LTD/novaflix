import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { creatorForgotPassword } from '../lib/auth'
import DynamicChevronBackdrop from '../components/features/DynamicChevronBackdrop'

export default function CreatorForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await creatorForgotPassword(email)
    setLoading(false)
    if (res.success) {
      setSent(true)
    } else {
      setError(res.error || 'Something went wrong')
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
          <h2 className="text-lg font-semibold mb-2">Forgot your password?</h2>
          <p className="text-sm text-on-surface-variant mb-6">Enter your creator account email and we'll send a secure reset link.</p>

          {error && (
            <div className="text-sm p-3 rounded-xl mb-4 bg-primary-container/10 text-primary border border-primary-container/20">{error}</div>
          )}

          {sent ? (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4 text-secondary">
                <Icon name="mark_email_read" size="lg" />
              </div>
              <p className="text-sm text-on-surface-variant mb-6">
                If a creator account exists for <span className="text-primary">{email}</span>, a reset link has been sent. It expires in 30 minutes.
              </p>
              <Link to="/creator/login" className="text-sm text-primary hover:underline">Back to Creator Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-on-surface-variant mb-1.5 block">Email</label>
                <div className="relative">
                  <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-black/40 border border-outline/20 rounded-xl pl-10 pr-4 py-3 text-sm on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/20 transition-all" />
                </div>
              </div>
              <button type="submit" disabled={loading || !email} className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary-container/20">
                {loading ? 'Please wait...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/creator/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Back to Creator Sign In</Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
