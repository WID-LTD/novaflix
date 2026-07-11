import { create } from 'zustand'
import { type FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastStore {
  toasts: ToastItem[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export function useToast() {
  const { addToast } = useToastStore()
  return {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    info: (msg: string) => addToast('info', msg),
  }
}

const iconMap: Record<ToastType, FC<{ className?: string }>> = {
  success: (props) => <CheckCircle className="text-success" {...props} />,
  error: (props) => <XCircle className="text-accent" {...props} />,
  info: (props) => <Info className="text-info" {...props} />,
}

const bgMap: Record<ToastType, string> = {
  success: 'border-success/30',
  error: 'border-accent/30',
  info: 'border-info/30',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`flex items-center gap-3 px-4 py-3 bg-surface-secondary border ${bgMap[toast.type]} rounded-xl shadow-2xl min-w-[300px]`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <p className="text-sm text-white flex-1">{toast.message}</p>
              <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
