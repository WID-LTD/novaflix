import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { resetPassword } from '../lib/auth'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import LoginBackdrop from '../components/features/LoginBackdrop'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
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
    const res = await resetPassword(token, password)
    setLoading(false)
    if (res.success) {
      setDone(true)
    } else {
      setError(res.error || 'Failed to reset password')
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
          {!token ? (
            <div className="text-center">
              <div className="flex justify-center mb-4 text-error">
                <Icon name="link_off" size="lg" />
              </div>
              <h1 className="text-headline-lg mb-2">Invalid reset link</h1>
              <p className="text-body-md text-on-surface-variant mb-6">This link is missing or malformed. Please request a new one.</p>
              <Link to="/forgot-password" className="text-primary-container font-semibold hover:underline">Request a new link</Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="flex justify-center mb-4 text-secondary">
                <Icon name="check_circle" size="lg" />
              </div>
              <h1 className="text-headline-lg mb-2">Password updated</h1>
              <p className="text-body-md text-on-surface-variant mb-6">Your password has been reset successfully. You can now sign in.</p>
              <Link to="/login" className="text-primary-container font-semibold hover:underline">Go to Sign In</Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-headline-lg mb-2">Choose a new password</h1>
                <p className="text-body-md text-on-surface-variant">Make sure it's at least 6 characters.</p>
              </div>

              {error && (
                <div className="bg-error-container/20 border border-error/20 text-error text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface opacity-80 ml-1">New Password</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg py-4 px-4 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md transition-all placeholder:text-on-surface-variant/40 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors p-2"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface opacity-80 ml-1">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg py-4 px-4 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md transition-all placeholder:text-on-surface-variant/40"
                  />
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} disabled={!password || !confirm}>
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
