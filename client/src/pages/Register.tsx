import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'
import Icon from '../components/ui/Icon'
import ObliqueColumnsBackdrop from '../components/features/ObliqueColumnsBackdrop'

const genres = [
  { name: 'Action', icon: 'swords' },
  { name: 'Comedy', icon: 'theater_comedy' },
  { name: 'Sci-Fi', icon: 'rocket_launch' },
  { name: 'Drama', icon: 'sentiment_dissatisfied' },
  { name: 'Horror', icon: 'skull' },
  { name: 'Documentary', icon: 'document_scanner' },
]

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { register } = useAuth()
  const [step, setStep] = useState(1)
  const [refCode, setRefCode] = useState(searchParams.get('ref') || '')

  useEffect(() => {
    if (refCode) {
      const el = document.getElementById('referral-toast')
      if (el) el.style.display = 'block'
    }
  }, [refCode])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateProgress = (s: number) => {
    const bar = document.getElementById('progress-bar')
    if (bar) {
      const widths = ['0%', '33%', '66%', '100%']
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

  const toggleGenre = (name: string) => {
    setSelectedGenres((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : prev.length < 3 ? [...prev, name] : prev
    )
  }

  const handleComplete = async () => {
    setError('')
    setLoading(true)
    const result = await register(email, password, displayName || undefined)
    setLoading(false)
    if (result.success) {
      // Redeem referral code if present
      if (refCode) {
        try {
          const token = localStorage.getItem('novaflix-token')
          if (token) {
            await fetch('/api/affiliate/redeem', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ code: refCode }),
            })
          }
        } catch {}
      }
      navigate('/profiles')
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <ObliqueColumnsBackdrop />

      <div className="relative z-10 w-full max-w-lg px-margin-mobile">
        <div className="text-center mb-8">
          <img src="/leter-mark-logo.png" alt="" className="mb-2 mx-auto" style={{ height: '400px', width: '800px', objectFit: 'contain' }} />
          <p className="text-on-surface-variant mt-2 font-body-md" style={{ position: 'relative', bottom: '120px' }}>Join the Cinematic Experience</p>
          {refCode && (
            <p className="text-secondary text-xs mt-2 flex items-center justify-center gap-1">
              <Icon name="group_add" className="w-3.5 h-3.5" />
              Referred by a friend!
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8 w-full bg-surface-variant/50 h-1 rounded-full overflow-hidden">
          <div className="h-full bg-primary-container transition-all duration-500 ease-out w-1/3" id="progress-bar" />
        </div>

        {/* Form Card */}
        <div className="glass-panel rounded-xl shadow-2xl p-6 md:p-8 min-h-[400px] border border-outline-variant/20" style={{ position: 'relative', bottom: '120px' }}>
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

          {/* Step 2: Details */}
          <div className={`transition-all duration-400 ${step === 2 ? 'opacity-100 relative' : 'opacity-0 absolute pointer-events-none scale-95'}`}>
            <h2 className="text-headline-md mb-6">About You</h2>
            <div className="space-y-4">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant mb-2 block">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={13}
                  placeholder="Enter your age"
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={() => prevStep(1)} className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-4 py-3 transition-colors">
                Back
              </button>
              <button onClick={() => nextStep(3)} className="bg-primary-container text-on-primary-container font-label-md text-label-md px-6 py-3 rounded-lg hover:bg-primary-container/90 transition-colors shadow-[0_4px_14px_rgba(229,9,20,0.4)]">
                Continue
              </button>
            </div>
          </div>

          {/* Step 3: Taste Profile */}
          <div className={`transition-all duration-400 ${step === 3 ? 'opacity-100 relative' : 'opacity-0 absolute pointer-events-none scale-95'}`}>
            <h2 className="text-headline-md mb-2">Taste Profile</h2>
            <p className="text-on-surface-variant font-label-md text-label-md mb-6">Select 3 genres to personalize your experience.</p>
            <div className="grid grid-cols-2 gap-3">
              {genres.map((genre) => {
                const isSelected = selectedGenres.includes(genre.name)
                return (
                  <button
                    key={genre.name}
                    onClick={() => toggleGenre(genre.name)}
                    className={`rounded-lg p-4 text-center cursor-pointer flex flex-col items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-primary-container/20 border border-primary-container'
                        : 'bg-surface-container border border-transparent hover:bg-surface-variant/50'
                    }`}
                  >
                    <Icon name={genre.icon} className="text-primary" />
                    <span className="font-label-sm text-label-sm">{genre.name}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-8 flex justify-between items-center">
              <button onClick={() => prevStep(2)} className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-4 py-3 transition-colors">
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={selectedGenres.length < 3 || loading}
                className={`font-label-md text-label-md px-6 py-3 rounded-lg transition-all ${
                  selectedGenres.length === 3
                    ? 'bg-primary-container text-on-primary-container hover:bg-primary-container/90 shadow-[0_4px_14px_rgba(229,9,20,0.4)]'
                    : 'bg-surface-variant text-on-surface-variant/50 cursor-not-allowed'
                }`}
              >
                {loading ? 'Creating Account...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
