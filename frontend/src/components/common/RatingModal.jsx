import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { hapticFeedback } from '@/lib/telegram'
import Button from '@/components/atoms/Button'
import Sheet from './Sheet'

export default function RatingModal({ ride, userId, targetUserId, targetType, onClose, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const targetName = targetType === 'driver'
    ? ride.driver?.user?.full_name || 'السائق'
    : ride.customer?.full_name || 'الزبون'

  const handleSubmit = async () => {
    if (!rating) return
    hapticFeedback('medium')
    setIsSubmitting(true)
    try {
      await api.ratings.create({
        ride_id: ride.id,
        from_user_id: userId,
        to_user_id: targetUserId,
        rating,
        comment: comment.trim() || null
      })
      hapticFeedback('success')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet isOpen={true} onClose={onClose} height="auto">
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-center">قيّم {targetName}</h3>

        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-5xl transition-colors"
              style={{
                color: (hoverRating || rating) >= star ? '#F59E0B' : '#CBD5E1'
              }}
            >
              ★
            </motion.button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            تعليق (اختياري)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="اكتب تعليقك هنا..."
            className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose}>
            لاحقاً
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!rating || isSubmitting}
            loading={isSubmitting}
          >
            إرسال التقييم
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
