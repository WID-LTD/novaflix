import { useState, useEffect, useRef } from 'react'
import Icon from '../ui/Icon'
import type { AdItem } from '../../lib/api'

interface AdOverlayProps {
  ad: AdItem | null
  onComplete: () => void
  onSkip: () => void
  visible: boolean
}

export default function AdOverlay({ ad, onComplete, onSkip, visible }: AdOverlayProps) {
  const [remaining, setRemaining] = useState(0)
  const [canSkip, setCanSkip] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const skipRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!ad || !visible) {
      setRemaining(0)
      setCanSkip(false)
      return
    }

    const dur = ad.duration_seconds || 15
    setRemaining(dur)
    setCanSkip(false)

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    if (ad.skip_after_seconds > 0) {
      skipRef.current = setTimeout(() => setCanSkip(true), ad.skip_after_seconds * 1000)
    } else {
      setCanSkip(true)
    }

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(skipRef.current)
    }
  }, [ad, visible, onComplete, onSkip])

  if (!ad || !visible) return null

  return (
    <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
      {ad.creative_type === 'image' ? (
        <img
          src={ad.creative_url}
          alt={ad.advertiser_name}
          className="w-full h-full object-contain"
        />
      ) : (
        <video
          src={ad.creative_url}
          autoPlay
          muted
          loop
          className="w-full h-full object-contain"
        />
      )}

      {/* Gradient overlay at bottom for HUD */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="campaign" className="text-accent" size="sm" />
            <span className="text-sm text-white/80">{ad.advertiser_name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 font-mono bg-black/40 px-2 py-1 rounded">
              Ad · {remaining}s remaining
            </span>
            {canSkip && (
              <button
                onClick={onSkip}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top-right ad countdown capsule (the "Ad 1 of 2" pattern) */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white/80 font-mono">
        Ad · {remaining}s
      </div>
    </div>
  )
}

export function AdTimelinePips({ ads, duration, currentTime }: { ads: AdItem[]; duration: number; currentTime: number }) {
  if (!ads.length || !duration) return null

  // Only show pips for mid-roll ads
  const midRolls = ads.filter((a) => a.position_type === 'mid_roll')

  return (
    <>
      {midRolls.map((ad, i) => {
        const pos = (ad.cue_time_seconds / duration) * 100
        const passed = currentTime >= ad.cue_time_seconds
        return (
          <div
            key={`pip-${i}`}
            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full z-10 ${
              passed ? 'bg-accent' : 'bg-white/60'
            }`}
            style={{ left: `${pos}%`, marginLeft: -4 }}
            title={`Ad at ${Math.floor(ad.cue_time_seconds / 60)}:${(ad.cue_time_seconds % 60).toString().padStart(2, '0')}`}
          />
        )
      })}
    </>
  )
}

export function AdCountdownHUD({ ads, currentAd }: { ads: AdItem[]; currentAd: AdItem | null }) {
  if (!ads.length) return null

  const totalAds = ads.filter((a) => a.position_type === 'mid_roll').length
  if (!totalAds) return null

  const currentIndex = currentAd ? ads.findIndex((a) => a.id === currentAd.id) : -1

  return null // Rendered inside AdOverlay instead
}
