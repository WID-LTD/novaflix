import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon'
import { getToken, initializeTip } from '../../lib/auth'

interface TipButtonProps {
  creatorId?: string
  recipientName?: string
  onTip?: (amount: number) => void
  className?: string
}

const presets = [
  { amount: 3, icon: 'coffee' as const, label: 'Coffee' },
  { amount: 5, icon: 'local_bar' as const, label: 'Beer' },
  { amount: 10, icon: 'rocket_launch' as const, label: 'Rocket' },
]

export default function TipButton({ creatorId, recipientName = 'this creator', onTip, className = '' }: TipButtonProps) {
  const [open, setOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const handleTip = async (amount: number) => {
    onTip?.(amount)
    if (!creatorId) {
      setStatus('done')
      setMsg('Thanks for the support!')
      setTimeout(() => {
        setStatus('idle')
        setOpen(false)
      }, 2000)
      return
    }
    const token = getToken()
    if (!token) {
      setStatus('error')
      setMsg('Please sign in to send a tip')
      return
    }
    setStatus('loading')
    setMsg('Opening secure checkout…')
    const res = await initializeTip(token, creatorId, amount)
    if (res.success && res.authorization_url) {
      window.location.href = res.authorization_url
    } else {
      setStatus('error')
      setMsg(res.error || 'Failed to start tip')
    }
  }

  const handleCustom = () => {
    const amt = parseFloat(customAmount)
    if (amt > 0) handleTip(amt)
  }

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-xl text-sm font-medium text-pink-300 hover:from-pink-500/30 hover:to-purple-500/30 transition-colors"
      >
        <Icon name="favorite" fill={true} className="text-pink-400" />
        Support
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute bottom-full left-0 mb-2 bg-surface-card border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[240px] z-50"
          >
            {status === 'done' ? (
              <div className="text-center py-4">
                <Icon name="favorite" fill={true} className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Thank you!</p>
                <p className="text-xs text-gray-400 mt-1">Your support means the world</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-white mb-3">
                  Support {recipientName}
                </p>
                <div className="flex gap-2 mb-3">
                  {presets.map((p) => {
                    return (
                      <button
                        key={p.amount}
                        onClick={() => handleTip(p.amount)}
                        disabled={status === 'loading'}
                        className="flex-1 flex flex-col items-center gap-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-premium/50 hover:bg-accent/10 transition-colors disabled:opacity-50"
                      >
                        <Icon name={p.icon} className="w-5 h-5 text-accent" />
                        <span className="text-xs font-semibold text-white">${p.amount}</span>
                        <span className="text-[10px] text-gray-500">{p.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Custom $"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-surface-container border border-outline/20 rounded-xl px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary"
                    min={1}
                  />
                  <button
                    onClick={handleCustom}
                    disabled={!customAmount || parseFloat(customAmount) <= 0 || status === 'loading'}
                    className="px-4 py-2 bg-accent text-black font-semibold text-sm rounded-xl disabled:opacity-50 hover:bg-accent-light transition-colors"
                  >
                    Send
                  </button>
                </div>

                {status !== 'idle' && (
                  <p className={`text-xs mt-2 ${status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                    {status === 'loading' ? 'Processing…' : msg}
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
