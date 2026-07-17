import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login')
    }, 3500)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background flex flex-col items-center justify-center">
      {/* Background gradient animation */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-primary-container/5 via-background to-background animate-pulse" />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#131313_100%)] opacity-80 pointer-events-none" />

      {/* Main content */}
      <main className="relative z-20 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="breathe-animation flex flex-col items-center"
        >
          <div className="w-24 h-24 md:w-32 lg:w-40 mb-6 rounded-full bg-primary-container flex items-center justify-center shadow-2xl shadow-primary-container/30">
            <span className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-on-primary-container tracking-tight">N</span>
          </div>
          <h1 className="text-display-md md:text-display-lg text-primary-container font-extrabold tracking-tight drop-shadow-2xl">
            NovaFlix
          </h1>
        </motion.div>
      </main>

      {/* Loading bar */}
      <div className="absolute bottom-16 w-48 md:w-64 h-1 bg-surface-variant/30 rounded-full overflow-hidden z-20 fade-in backdrop-blur-md">
        <div className="loading-bar rounded-full" />
      </div>

      {/* Subtle text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="absolute bottom-8 z-20 font-label-sm text-label-sm text-on-surface-variant tracking-[0.2em] uppercase"
      >
        Initializing Core
      </motion.p>
    </div>
  )
}
