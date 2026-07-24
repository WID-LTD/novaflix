import { motion } from 'framer-motion'

export default function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-24 h-24">
        <motion.img
          src="/nova-logo.png"
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.img
          src="/flix-logo.png"
          alt=""
          className="absolute inset-0 w-full h-full object-contain scale-75"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary-container/40 to-transparent -skew-y-12 animate-beam" />
        </motion.div>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-3 h-3 rounded-full bg-primary-container shadow-lg shadow-primary-container/50" />
        </motion.div>
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">
        Loading
      </p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
