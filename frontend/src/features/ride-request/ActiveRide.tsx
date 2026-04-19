import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/app/store'
import { supabase } from '@/lib/supabase'
import RatingModal from '@/components/common/RatingModal'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'
import { hapticFeedback, showConfirm } from '@/lib/telegram'

export default function ActiveRide() {
  const { activeRide, user, updateRideStatus, resetRide } = useAppStore()
  const [elapsed, setElapsed] = useState(0)
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    if (!activeRide) return
    const channel = supabase.channel(`ride-${activeRide.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${activeRide.id}` }, (payload) => {
      const r = payload.new
      if (r.status !== activeRide.status) {
        if (r.status === 'accepted') { hapticFeedback('heavy'); updateRideStatus('accepted') }
        else if (r.status === 'arrived') updateRideStatus('arrived')
        else if (r.status === 'cancelled') { showConfirm('تم الإلغاء', ok => ok && resetRide()) }
        else if (r.status === 'completed') { updateRideStatus('completed'); setShowRating(true) }
      }
    }).subscribe()
    const timer = setInterval(() => setElapsed(p => p + 1), 1000)
    return () => { supabase.removeChannel(channel); clearInterval(timer) }
  }, [activeRide?.id])

  const handleCancel = () => showConfirm('إلغاء الرحلة؟', async ok => { if (!ok) return; await fetch(`${import.meta.env.VITE_API_URL}/api/rides/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ride_id: activeRide!.id, cancelled_by: user?.role }) }); resetRide() })

  if (!activeRide) return null

  return (
    <>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="active-ride">
        <div className="status">{activeRide.status}</div>
        <div className="timer">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</div>
        {activeRide.driver && <div className="driver-info"><span>{activeRide.driver.vehicle_model}</span><a href={`tel:${activeRide.driver.user_id}`}>📞</a></div>}
        <div className="addresses"><div>من: {activeRide.pickup_address}</div><div>إلى: {activeRide.dropoff_address}</div></div>
        <div className="price">{activeRide.payment_method === 'stars' ? formatStarsPrice(activeRide.stars_price!) : formatPrice(activeRide.price)}</div>
        {['pending', 'searching', 'accepted'].includes(activeRide.status) && <button className="btn-danger" onClick={handleCancel}>إلغاء</button>}
      </motion.div>
      {showRating && <RatingModal ride={activeRide} userId={user!.id} targetUserId={user?.role === 'customer' ? activeRide.driver?.user_id! : activeRide.customer_id} targetType={user?.role === 'customer' ? 'driver' : 'customer'} onClose={() => { setShowRating(false); resetRide() }} onSuccess={() => { setShowRating(false); resetRide() }} />}
    </>
  )
}
