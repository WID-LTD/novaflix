import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { creatorRegister, creatorLoginVerify, setToken, getToken } from '../lib/auth'
import { API_BASE } from '../lib/config'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import ObliqueColumnsBackdrop from '../components/features/ObliqueColumnsBackdrop'

const GENRES = ['Action', 'Comedy', 'Sci-Fi', 'Drama', 'Horror', 'Documentary']

export default function CreatorSignup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [category, setCategory] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerify, setNeedsVerify] = useState(false)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [userId, setUserId] = useState('')

  const isValidUrl = (url: string) => {
    if (!url) return true
    try { new URL(url); return true } catch { return false }
  }

  useEffect(() => {
    if (getToken() && !needsVerify) {
      navigate('/creator')
    }
  }, [needsVerify])

  const updateProgress = (s: number) => {
    const bar = document.getElementById('progress-bar')
    if (bar) {
      const widths = ['0%', '50%', '100%']
      bar.style.width = widths[s]
    }
  }

  const nextStep = (s: number) => {
    setStep(s)
    updateProgress(s)
  }

  const prevStep = (s: number) => {
    setStep(s)
    updateProgress(s)
  }

  const handleComplete = async () => {
    setError('')
    if (portfolioUrl && !isValidUrl(portfolioUrl)) {
      setError('Please enter a valid URL')
      return
    }
    setLoading(true)
    const result = await creatorRegister(email, password, displayName || undefined, {
      bio: bio || undefined,
      category: category || undefined,
      portfolioUrl: portfolioUrl || undefined,
    })
    setLoading(false)
    if (result.success && result.userId) {
      setUserId(result.userId)
      setNeedsVerify(true)
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  const handleVerify = async () => {
    setError('')
    setVerifying(true)
    const result = await creatorLoginVerify(userId, code)
    setVerifying(false)
    if (result.success) {
      if (result.token) setToken(result.token)
      navigate('/creator')
    } else {
      setError(result.error || 'Verification failed')
    }
  }

  const handleResend = async () => {
    setError('')
    const result = await creatorRegister(email, password, displayName || undefined)
    if (!result.success) {
      setError(result.error || 'Failed to resend code')
    }
  }

  if (needsVerify) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        <ObliqueColumnsBackdrop />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md px-margin-mobile"
        >
          <div className="glass-panel rounded-xl p-8 shadow-2xl border border-outline-variant/20">
            <div className="text-center mb-8">
              <h1 className="text-headline-md mb-2">Verify your email</h1>
              <p className="text-body-md text-on-surface-variant">
                6-digit code sent to <span className="text-primary">{email}</span>
              </p>
            </div>
            {error && (
              <div className="bg-error-container/20 border border-error/20 text-error text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
            )}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value)}
                maxLength={6}
                className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg py-4 px-4 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
              <Button className="w-full" size="lg" loading={verifying} onClick={handleVerify} disabled={code.length !== 6}>
                Verify Email
              </Button>
              <button onClick={handleResend} className="w-full text-sm text-on-surface-variant hover:text-primary transition-colors font-label-md">
                Resend code
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <ObliqueColumnsBackdrop />

      <div className="relative z-10 w-full max-w-lg px-margin-mobile">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container/10 mb-4 mx-auto ring-1 ring-primary-container/20">
            <Icon name="videocam" className="text-primary-container text-4xl" />
          </div>
          <p className="text-on-surface-variant mt-2 font-body-md">Join NovaFlix Studio</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 w-full bg-surface-variant/50 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-primary-container transition-all duration-500 ease-out w-1/2" id="progress-bar" />
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-xl shadow-2xl p-6 md:p-8 min-h-[400px] border border-outline-variant/20">
          {/* Step 1: Credentials */}
          <div className={`transition-all duration-400 ${step === 1 ? 'opacity-100 relative' : 'opacity-0 absolute pointer-events-none scale-95'}`}>
            <h2 className="text-headline-md mb-6">Create Account</h2>
            {error && <div className="bg-error-container/20 text-error text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => nextStep(2)}
                disabled={!email || !password}
                className="bg-primary-container text-on-primary-container font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-primary-container/90 transition-colors shadow-[0_4px_14px_rgba(229,9,20,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Step 2: Profile Details */}
          <div className={`transition-all duration-400 ${step === 2 ? 'opacity-100 relative' : 'opacity-0 absolute pointer-events-none scale-95'}`}>
            <h2 className="text-headline-md mb-6">Your Studio Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your creator name"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                >
                  <option value="">Select a category</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell viewers about yourself..."
                  rows={3}
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md resize-none"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Portfolio URL (optional)</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => prevStep(1)} className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-4 py-3 transition-colors">
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={!displayName || loading}
                className={`font-label-md text-label-md px-6 py-3 rounded-lg transition-all ${
                  displayName
                    ? 'bg-primary-container text-on-primary-container hover:bg-primary-container/90 shadow-[0_4px_14px_rgba(229,9,20,0.4)]'
                    : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'
                }`}
              >
                {loading ? 'Creating Account...' : 'Create Studio Account'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-body-md text-on-surface-variant">
            Already a creator?{' '}
            <Link to="/login" className="text-primary-container font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}