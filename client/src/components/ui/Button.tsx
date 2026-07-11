import { type ButtonHTMLAttributes, type FC } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantStyles: Record<string, string> = {
  primary: 'bg-accent text-white hover:bg-red-700 shadow-lg shadow-red-900/30',
  secondary: 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm',
  ghost: 'text-white hover:bg-white/10',
  outline: 'border border-white/20 text-white hover:border-white/40 hover:bg-white/5',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-8 py-3.5 text-base rounded-xl',
}

const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}
      `}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  )
}

export default Button
