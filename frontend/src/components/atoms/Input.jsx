import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

const Input = forwardRef(({
  label,
  error,
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full mb-4">
      {label && <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{icon}</span>}
        <input
          ref={ref}
          className={twMerge(
            'w-full px-4 py-3 border rounded-lg bg-surface text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'transition-all duration-200',
            icon && 'pl-10',
            error && 'border-danger focus:ring-danger/20 focus:border-danger',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
