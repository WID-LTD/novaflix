import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { forgotPassword } from '../lib/auth'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import LoginBackdrop from '../components/features/LoginBackdrop'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await forgotPassword(email)
    setLoading(false)
    if (res.success) {
      setSent(true)
    } else {
      setError(res.error || 'Something went wrong')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <LoginBackdrop />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black z-[1]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[480px] px-4"
      >
        <div className="glass-panel rounded-xl p-8 md:p-12 shadow-2xl border border-outline-variant/20">
          <div className="text-center mb-8">
            <h1 className="text-headline-lg mb-2">Forgot your password?</h1>
            <p className="text-body-md text-on-surface-variant">Enter your email and we'll send you a secure reset link.</p>
          </div>

          {error && (
            <div className="bg-error-container/20 border border-error/20 text-error text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
          )}

          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Icon name="mark_email_read" size="lg" className="text-primary-container" />
              </div>
              <p className="text-body-md text-on-surface-variant mb-6">
                If an account exists for <span className="text-primary">{email}</span>, a reset link has been sent to your inbox. The link expires in 30 minutes.
              </p>
              <Link to="/login" className="text-primary-container font-semibold hover:underline">Back to Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface opacity-80 ml-1">Email Address</label>
                <div className="relative group">
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg py-4 px-4 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md transition-all placeholder:text-on-surface-variant/40"
                  />
                  <Icon name="alternate_email" size="sm" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary-container transition-colors" />
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!email}>
                Send Reset Link
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
