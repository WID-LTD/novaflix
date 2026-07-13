import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Coffee, Beer, Rocket } from 'lucide-react'

interface TipButtonProps {
  recipientName?: string
  onTip?: (amount: number) => void
  className?: string
}

const presets = [
  { amount: 3, icon: Coffee, label: 'Coffee' },
  { amount: 5, icon: Beer, label: 'Beer' },
  { amount: 10, icon: Rocket, label: 'Rocket' },
]

export default function TipButton({ recipientName = 'this creator', onTip, className = '' }: TipButtonProps) {
  const [open, setOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [showThanks, setShowThanks] = useState(false)

  const handleTip = (amount: number) => {
    onTip?.(amount)
    setShowThanks(true)
    setTimeout(() => {
      setShowThanks(false)
      setOpen(false)
    }, 2000)
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
        <Heart className="w-4 h-4 fill-pink-400" />
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
            {showThanks ? (
              <div className="text-center py-4">
                <Heart className="w-8 h-8 text-pink-400 fill-pink-400 mx-auto mb-2" />
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
                    const Icon = p.icon
                    return (
                      <button
                        key={p.amount}
                        onClick={() => handleTip(p.amount)}
                        className="flex-1 flex flex-col items-center gap-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-premium/50 hover:bg-accent/10 transition-colors"
                      >
                        <Icon className="w-5 h-5 text-accent" />
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
                    className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-premium"
                    min={1}
                  />
                  <button
                    onClick={handleCustom}
                    disabled={!customAmount || parseFloat(customAmount) <= 0}
                    className="px-4 py-2 bg-accent text-black font-semibold text-sm rounded-xl disabled:opacity-50 hover:bg-accent-light transition-colors"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
