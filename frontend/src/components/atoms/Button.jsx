import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'
import PropTypes from 'prop-types'

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark',
  secondary: 'bg-surface text-text-primary border border-border hover:bg-background active:bg-background',
  danger: 'bg-danger text-white hover:opacity-90 active:opacity-90',
  success: 'bg-success text-white hover:opacity-90 active:opacity-90',
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/5 active:bg-primary/10',
  ghost: 'bg-transparent text-text-secondary hover:bg-background active:bg-background'
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm rounded-full',
  md: 'px-6 py-3 text-base rounded-full',
  lg: 'px-8 py-4 text-lg rounded-full',
  icon: 'p-3 rounded-full'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold border-none cursor-pointer transition-all duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'
  const widthClass = fullWidth ? 'w-full' : 'w-auto'
  
  const classes = twMerge(clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    loading && 'relative !text-transparent',
    className
  ))

  return (
    <motion.button
      type={type}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" />
        </span>
      )}
      {children}
    </motion.button>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'icon']),
  fullWidth: PropTypes.bool,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.string
}
