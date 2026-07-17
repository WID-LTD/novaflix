import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '../ui/Icon'
import { grantBingePass } from '../../lib/api'

interface BingePassModalProps {
  open: boolean
  onClose: () => void
  onGranted: () => void
  contentId?: string
}

export default function BingePassModal({ open, onClose, onGranted, contentId }: BingePassModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleWatchAd = async () => {
    setLoading(true)
    setError('')
    const res = await grantBingePass(contentId, 60)
    setLoading(false)
    if (res.success) {
      onGranted()
    } else {
      setError(res.error || 'Failed to grant binge pass')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="bg-surface-card border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Icon name="play_circle" className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-headline-md mb-2">Watch One Ad, Unlock 60 Minutes</h2>
              <p className="text-on-surface-variant text-body-md">
                Watch a single 60-second ad and enjoy<strong className="text-on-surface"> 60 minutes of completely uninterrupted, ad-free viewing</strong>.
              </p>
            </div>

            {error && (
              <div className="bg-error-container/20 border border-error/20 text-error text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleWatchAd}
                disabled={loading}
                className="w-full py-4 bg-accent text-black font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name="play_arrow" /> Watch Ad (60s)
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 text-on-surface-variant hover:text-on-surface font-label-md transition-colors"
              >
                No thanks, I'll tolerate ads
              </button>
            </div>

            <p className="text-xs text-on-surface-variant/50 text-center mt-4">
              Binge pass lasts 24 hours or until the 60 minutes are used up.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
