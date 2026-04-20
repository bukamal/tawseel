import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback } from '@/lib/telegram';

export default function RatingModal({ ride, userId, targetUserId, targetType, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const targetName = targetType === 'driver' ? ride.driver?.user?.full_name || 'السائق' : ride.customer?.full_name || 'الزبون';

  const submit = async () => {
    if (!rating) return;
    hapticFeedback('medium');
    setIsSubmitting(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/ratings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ride_id: ride.id, from_user_id: userId, to_user_id: targetUserId, rating, comment })
      });
      hapticFeedback('success');
      onSuccess?.();
    } catch { }
    finally { setIsSubmitting(false); }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
        <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: 24, width: '100%', maxWidth: 500 }} onClick={e => e.stopPropagation()}>
          <h3 style={{ textAlign: 'center' }}>قيّم {targetName}</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '20px 0' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} style={{ fontSize: 44, color: (hover || rating) >= s ? '#FFB800' : '#DDD', cursor: 'pointer' }}>★</span>
            ))}
          </div>
          <textarea placeholder="تعليق (اختياري)" value={comment} onChange={e => setComment(e.target.value)} style={{ width: '100%', padding: 14, border: '1px solid #E0E0E0', borderRadius: 12, minHeight: 100, marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 14, background: '#F5F5F5', border: 'none', borderRadius: 12 }}>لاحقاً</button>
            <button onClick={submit} disabled={!rating || isSubmitting} style={{ flex: 1, padding: 14, background: rating ? '#007AFF' : '#CCC', color: 'white', border: 'none', borderRadius: 12 }}>{isSubmitting ? 'جاري...' : 'إرسال'}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
