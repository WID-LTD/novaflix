import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/AuthContext'

export default function Splash() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => navigate('/home'), 5000)
    return () => clearTimeout(timer)
  }, [navigate, user, loading])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background flex flex-col items-center justify-center">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-radial from-primary-container/5 via-background to-background animate-pulse" />
      </div>

      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#131313_100%)] opacity-80 pointer-events-none" />

      <main className="relative z-20 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <motion.img
            src="/combination-mark-logo.png"
            alt="NovaFlix"
            className="w-48 md:w-56 lg:w-64 h-auto drop-shadow-2xl"
            animate={{
              scale: [1, 1.05, 1],
              filter: [
                'drop-shadow(0 0 0px rgba(229,9,20,0))',
                'drop-shadow(0 0 20px rgba(229,9,20,0.4))',
                'drop-shadow(0 0 0px rgba(229,9,20,0))',
              ],
            }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
              repeat: Infinity,
              delay: 1.5,
            }}
          />
        </motion.div>
      </main>

      <div className="absolute bottom-16 w-48 md:w-64 h-1 bg-surface-variant/30 rounded-full overflow-hidden z-20 backdrop-blur-md">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'easeInOut' }}
          className="h-full bg-primary rounded-full"
        />
      </div>

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
