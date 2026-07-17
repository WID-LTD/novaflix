import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-surface-secondary border border-white/10 rounded-xl
            text-accent placeholder-gray-500
            transition-all duration-200
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-12 pr-4' : 'px-4'}
            py-3 text-sm
            ${className}
          `}
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
