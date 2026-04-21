import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Sheet({ isOpen, onClose, children, height = 'auto', showHandle = true }) {
  const sheetRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleBackdropClick = (e) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target)) {
      onClose()
    }
  }

  const sheetContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 max-w-[500px] mx-auto bg-surface rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '90dvh', height }}
          >
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-border rounded-full" />
              </div>
            )}
            <div className="overflow-y-auto max-h-[calc(90dvh-2rem)] p-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(sheetContent, document.body)
}
