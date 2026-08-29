import { useState, useMemo } from 'react'
import Icon from '../ui/Icon'

interface PasswordFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showStrength?: boolean
  error?: string
  className?: string
  disabled?: boolean
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' }
  if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' }
  if (score <= 3) return { score, label: 'Strong', color: '#22c55e' }
  return { score, label: 'Very Strong', color: '#10b981' }
}

export default function PasswordField({
  value,
  onChange,
  placeholder = 'Create a password',
  showStrength = true,
  error,
  className = '',
  disabled = false,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const strength = useMemo(() => getStrength(value), [value])
  const bars = 4

  return (
    <div className={className}>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container font-body-md transition-all placeholder:text-on-surface-variant/40"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors p-1"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size="sm" />
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {Array.from({ length: bars }).map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i < Math.ceil((strength.score / 5) * bars)
                    ? strength.color
                    : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
          <p className="text-xs font-label-sm" style={{ color: strength.color }}>
            {strength.label}
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-error mt-1">{error}</p>
      )}
    </div>
  )
}
