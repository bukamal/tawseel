import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const tapAnimation = disabled || loading ? {} : { scale: 0.97 }

  const baseClasses = 'btn'
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`
  const widthClass = fullWidth ? 'btn-full' : 'btn-auto'
  const stateClass = loading ? 'btn-loading' : ''

  return (
    <motion.button
      type={type}
      whileTap={tapAnimation}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${stateClass} ${className}`}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" />
      ) : (
        children
      )}
    </motion.button>
  )
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'outline', 'warning']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
}

export default Button
