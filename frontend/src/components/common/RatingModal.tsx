import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Ride } from '@/types'

interface RatingModalProps {
  ride: Ride
  userId: string
  targetUserId: string
  targetType: 'driver' | 'customer'
  onClose: () => void
  onSuccess: () => void
}

export default function RatingModal({ ride, userId, targetUserId, targetType, onClose, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hover, setHover] = useState(0)
  const targetName = targetType === 'driver' ? ride.driver?.user_id : ride.customer?.full_name

  const submit = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/ratings/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride_id: ride.id, from_user_id: userId, to_user_id: targetUserId, rating, comment })
    })
    onSuccess()
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rating-modal" onClick={onClose}>
        <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} className="content" onClick={e => e.stopPropagation()}>
          <h3>قيّم {targetName}</h3>
          <div className="stars">
            {[1, 2, 3, 4, 5].map(s => <span key={s} onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} style={{ color: (hover || rating) >= s ? '#FFB800' : '#ddd', fontSize: 40, cursor: 'pointer' }}>★</span>)}
          </div>
          <textarea placeholder="تعليق (اختياري)" value={comment} onChange={e => setComment(e.target.value)} />
          <div className="actions">
            <button onClick={onClose}>لاحقاً</button>
            <button onClick={submit} disabled={!rating}>إرسال</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
