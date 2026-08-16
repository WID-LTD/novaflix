import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon'
import { useStore } from '../../store/useStore'

interface OnboardingStep {
  targetSelector: string
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

interface OnboardingTourProps {
  steps: OnboardingStep[]
  storageKey: string
  onComplete?: () => void
  onSkip?: () => void
}

export default function OnboardingTour({ steps, storageKey, onComplete, onSkip }: OnboardingTourProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const [arrowDir, setArrowDir] = useState<'up' | 'down' | 'left' | 'right'>('up')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 0 })
  const drawerOpen = useStore((s) => s.mobileDrawerOpen)
  const suppressedByDrawer = useRef(false)

  useEffect(() => {
    if (drawerOpen && visible) {
      suppressedByDrawer.current = true
      setVisible(false)
    } else if (!drawerOpen && suppressedByDrawer.current) {
      suppressedByDrawer.current = false
      setVisible(true)
    }
  }, [drawerOpen, visible])

  useEffect(() => {
    const done = localStorage.getItem(storageKey)
    if (done) return
    setVisible(true)
  }, [storageKey])

  const reposition = useCallback(() => {
    const step = steps[activeStep]
    if (!step) return
    const target = document.querySelector(step.targetSelector)
    if (!target) return
    const rect = target.getBoundingClientRect()
    setTargetRect(rect)

    const placement = step.placement || 'bottom'
    const tw = tooltipSize.width
    const gap = 16
    const arrowSize = 10
    let top = 0, left = 0
    let dir: 'up' | 'down' | 'left' | 'right' = 'up'

    switch (placement) {
      case 'top':
        top = rect.top - gap - arrowSize
        left = rect.left + rect.width / 2 - tw / 2
        dir = 'down'
        break
      case 'bottom':
        top = rect.bottom + gap + arrowSize
        left = rect.left + rect.width / 2 - tw / 2
        dir = 'up'
        break
      case 'left':
        top = rect.top + rect.height / 2
        left = rect.left - gap - arrowSize - tw
        dir = 'right'
        break
      case 'right':
        top = rect.top + rect.height / 2
        left = rect.right + gap + arrowSize
        dir = 'left'
        break
    }

    // Keep within viewport
    const padding = 16
    if (left < padding) left = padding
    if (left + tw > window.innerWidth - padding) left = window.innerWidth - padding - tw

    setTooltipPos({ top, left })
    setArrowDir(dir)
  }, [activeStep, steps, tooltipSize])

  useEffect(() => {
    if (!visible) return
    reposition()
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    const observer = new MutationObserver(reposition)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      observer.disconnect()
    }
  }, [visible, reposition])

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      setTooltipSize({ width: rect.width || 320, height: rect.height })
    }
  }, [activeStep])

  if (!visible) return null

  const step = steps[activeStep]
  const isLast = activeStep === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(storageKey, 'true')
      setVisible(false)
      onComplete?.()
    } else {
      setActiveStep((p) => p + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true')
    setVisible(false)
    onSkip?.()
  }

  const handlePrev = () => {
    if (activeStep > 0) setActiveStep((p) => p - 1)
  }

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  }

  if (arrowDir === 'up') {
    arrowStyle.top = -10
    arrowStyle.left = 160
    arrowStyle.borderWidth = '0 10px 10px 10px'
    arrowStyle.borderColor = 'transparent transparent rgba(255,255,255,0.1) transparent'
  } else if (arrowDir === 'down') {
    arrowStyle.bottom = -10
    arrowStyle.left = 160
    arrowStyle.borderWidth = '10px 10px 0 10px'
    arrowStyle.borderColor = 'rgba(255,255,255,0.1) transparent transparent transparent'
  } else if (arrowDir === 'left') {
    arrowStyle.right = -10
    arrowStyle.top = '50%'
    arrowStyle.marginTop = -10
    arrowStyle.borderWidth = '10px 0 10px 10px'
    arrowStyle.borderColor = 'transparent transparent transparent rgba(255,255,255,0.1)'
  } else if (arrowDir === 'right') {
    arrowStyle.left = -10
    arrowStyle.top = '50%'
    arrowStyle.marginTop = -10
    arrowStyle.borderWidth = '10px 10px 10px 0'
    arrowStyle.borderColor = 'transparent rgba(255,255,255,0.1) transparent transparent'
  }

  // Spotlight overlay with a "cutout" around the target
  const spotlightStyle: React.CSSProperties | undefined = targetRect ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: 9998,
    boxShadow: `rgba(0,0,0,0.7) 0px 0px 0px 9999px inset`,
  } : undefined

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          {/* Spotlight overlay */}
          {targetRect && (
            <div style={spotlightStyle}>
              <div
                style={{
                  position: 'absolute',
                  top: targetRect.top - 4,
                  left: targetRect.left - 4,
                  width: targetRect.width + 8,
                  height: targetRect.height + 8,
                  borderRadius: '12px',
                  boxShadow: '0 0 0 2px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.1)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            key={activeStep}
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              top: tooltipPos.top,
              left: tooltipPos.left,
              width: 320,
              zIndex: 10000,
              pointerEvents: 'auto',
            }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-5"
          >
            <div style={arrowStyle} />

            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Icon name="touch_app" className="text-primary" size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">{step.title}</h3>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
              <span className="text-[10px] text-white/30 font-mono">
                {activeStep + 1} / {steps.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="text-[11px] text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Skip
                </button>
                {activeStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                  >
                    <Icon name="chevron_left" size="sm" />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:brightness-110 transition-all"
                >
                  {isLast ? 'Got it' : 'Next'}
                  {!isLast && <Icon name="chevron_right" size="sm" />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
