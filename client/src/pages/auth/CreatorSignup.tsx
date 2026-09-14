import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { API_BASE } from '../../lib/config'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import ObliqueColumnsBackdrop from '../../components/features/ObliqueColumnsBackdrop'
import PasswordField from '../../components/auth/PasswordField'
import SocialLoginButtons from '../../components/social/SocialLoginButtons'

export default function CreatorSignup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [platformName, setPlatformName] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerify, setNeedsVerify] = useState(false)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [userId, setUserId] = useState('')
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('novaflix-token')
    if (token && !needsVerify) {
      navigate('/creator', { replace: true })
    }
  }, [needsVerify, navigate])

  const updateProgress = (s: number) => {
    const bar = document.getElementById('creator-progress-bar')
    if (bar) {
      const widths = ['0%', '50%', '100%']
      bar.style.width = widths[s - 1] || '0%'
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

  const handleSignup = async () => {
    setError('')
    if (!platformName) {
      setError('Platform/Studio name is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/signup/creator-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          platformName,
          socialMediaLinks: {
            youtube: youtubeUrl || undefined,
            instagram: instagramUrl || undefined,
            twitter: twitterUrl || undefined,
          },
          bio: bio || undefined,
        }),
      })
      const data = await res.json()
      setLoading(false)

      if (data.success && data.userId) {
        setUserId(data.userId)
        setNeedsVerify(true)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setLoading(false)
      setError('Network error')
    }
  }

  const handleVerify = async () => {
    setError('')
    setVerifying(true)
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      })
      const data = await res.json()
      setVerifying(false)

      if (data.success) {
        localStorage.setItem('novaflix-token', data.token)
        setRedirecting(true)
        await new Promise(r => setTimeout(r, 800))
        navigate('/creator')
      } else {
        setError(data.error || 'Invalid code')
      }
    } catch {
      setVerifying(false)
      setError('Verification failed')
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to resend code')
      }
    } catch {
      setError('Failed to resend code')
    }
  }

  if (needsVerify) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        <ObliqueColumnsBackdrop />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md px-4"
        >
          <div className="glass-panel rounded-xl p-8 shadow-2xl border border-outline-variant/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container/10 mb-4 mx-auto ring-1 ring-primary-container/20">
                <Icon name="videocam" className="text-primary-container text-4xl" />
              </div>
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
              <Button className="w-full" size="lg" loading={verifying || redirecting} onClick={handleVerify} disabled={code.length !== 6}>
                {redirecting ? 'Redirecting to Studio...' : 'Verify & Launch Studio'}
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

      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container/10 mb-4 mx-auto ring-1 ring-primary-container/20">
            <Icon name="videocam" className="text-primary-container text-4xl" />
          </div>
          <h1 className="text-headline-md mb-2">Become a Creator</h1>
          <p className="text-on-surface-variant mt-2 font-body-md">Join NovaFlix Studio</p>
        </div>

        <div className="mb-8 w-full bg-surface-variant/50 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-primary-container transition-all duration-500 ease-out w-1/2" id="creator-progress-bar" />
        </div>

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
              <PasswordField
                value={password}
                onChange={setPassword}
                placeholder="Create a password (min 8 characters)"
                showStrength
              />
              <div className="relative my-8 flex items-center">
                <div className="flex-grow border-t border-outline-variant/20" />
                <span className="mx-4 font-label-sm text-label-sm text-on-surface-variant/50">OR CONTINUE WITH</span>
                <div className="flex-grow border-t border-outline-variant/20" />
              </div>
              <button
                type="button"
                onClick={() => { window.location.href = `${API_BASE}/auth/google?redirect=/creator` }}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-surface-container-high border border-outline-variant/20 hover:bg-surface-container-highest transition-all duration-150 active:scale-95"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-label-md text-label-md text-on-surface">Sign up with Google</span>
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = `${API_BASE}/auth/social/apple?redirect=/creator` }}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-surface-container-high border border-outline-variant/20 hover:bg-surface-container-highest transition-all duration-150 active:scale-95 mt-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.031 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701"/>
                </svg>
                <span className="font-label-md text-label-md text-on-surface">Sign up with Apple</span>
              </button>
              <SocialLoginButtons redirect="/creator" exclude={['google', 'apple']} />
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => nextStep(2)}
                disabled={!email || !password || password.length < 8}
                className="bg-primary-container text-on-primary-container font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-primary-container/90 transition-colors shadow-[0_4px_14px_rgba(229,9,20,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Step 2: Studio Profile */}
          <div className={`transition-all duration-400 ${step === 2 ? 'opacity-100 relative' : 'opacity-0 absolute pointer-events-none scale-95'}`}>
            <h2 className="text-headline-md mb-6">Your Studio Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Platform / Studio Name *</label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="e.g. ESPN Sports, Indie Films Co."
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">YouTube URL (optional)</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@yourchannel"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Instagram URL (optional)</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourhandle"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Twitter / X URL (optional)</label>
                <input
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/yourhandle"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell viewers about your content..."
                  rows={3}
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md resize-none"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => prevStep(1)} className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-4 py-3 transition-colors">
                Back
              </button>
              <button
                onClick={handleSignup}
                disabled={!platformName || loading}
                className={`font-label-md text-label-md px-6 py-3 rounded-lg transition-all ${
                  platformName
                    ? 'bg-primary-container text-on-primary-container hover:bg-primary-container/90 shadow-[0_4px_14px_rgba(229,9,20,0.4)]'
                    : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="bg-surface-container/50 rounded-xl p-4 mb-4 border border-outline-variant/10">
            <Icon name="info" size="sm" className="text-primary-container inline mr-2" />
            <span className="text-body-md text-on-surface-variant">Your application will be reviewed within 48 hours</span>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Already a creator?{' '}
            <Link to="/auth/login" className="text-primary-container font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
