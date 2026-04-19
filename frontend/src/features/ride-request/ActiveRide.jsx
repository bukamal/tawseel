import { useEffect, useState } from 'react'
import { useAppStore } from '@/app/store'
import { supabase } from '@/lib/supabase'
import RatingModal from '@/components/common/RatingModal'
import { formatPrice, formatStarsPrice, getStatusText } from '@/utils/formatters'
import { hapticFeedback, showConfirm } from '@/lib/telegram'

export default function ActiveRide() {
  const { activeRide, user, updateRideStatus, resetRide } = useAppStore()
  const [elapsed, setElapsed] = useState(0)
  const [showRating, setShowRating] = useState(false)

  useEffect(() => {
    if (!activeRide) return
    const channel = supabase
      .channel(`ride-${activeRide.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${activeRide.id}` }, payload => {
        const r = payload.new
        if (r.status !== activeRide.status) {
          if (r.status === 'accepted') { hapticFeedback('heavy'); updateRideStatus('accepted') }
          else if (r.status === 'arrived') updateRideStatus('arrived')
          else if (r.status === 'cancelled') { showConfirm('تم إلغاء الرحلة', ok => ok && resetRide()) }
          else if (r.status === 'completed') { updateRideStatus('completed'); setShowRating(true) }
        }
      })
      .subscribe()
    const timer = setInterval(() => setElapsed(p => p + 1), 1000)
    return () => { supabase.removeChannel(channel); clearInterval(timer) }
  }, [activeRide?.id])

  const handleCancel = () => showConfirm('هل تريد إلغاء الرحلة؟', async ok => {
    if (!ok) return
    await fetch(`${import.meta.env.VITE_API_URL}/api/rides/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride_id: activeRide.id, cancelled_by: user?.role })
    })
    resetRide()
  })

  if (!activeRide) return null

  const targetUserId = user?.role === 'customer' ? activeRide.driver?.user_id : activeRide.customer_id
  const targetType = user?.role === 'customer' ? 'driver' : 'customer'

  return (
    <>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
          <h3>{getStatusText(activeRide.status)}</h3>
          <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
        </div>
        {activeRide.driver && (
          <div style={{ display: 'flex', alignItems: 'center', padding: 15, background: '#f5f5f5', borderRadius: 12, marginBottom: 15 }}>
            <span style={{ fontSize: 24, marginRight: 10 }}>👤</span>
            <div>
              <p><strong>{activeRide.driver.user?.full_name}</strong></p>
              <p>{activeRide.driver.vehicle_model} ({activeRide.driver.plate_number})</p>
              <p>⭐ {activeRide.driver.rating}</p>
            </div>
            <a href={`tel:${activeRide.driver.user?.phone}`} style={{ marginLeft: 'auto', padding: 10, background: '#34C759', color: 'white', borderRadius: 8, textDecoration: 'none' }}>📞</a>
          </div>
        )}
        <div style={{ marginBottom: 15 }}>
          <div style={{ padding: 12, background: '#E3F2FD', borderRadius: 8, marginBottom: 8 }}><small>من:</small> {activeRide.pickup_address}</div>
          <div style={{ padding: 12, background: '#FFEBEE', borderRadius: 8 }}><small>إلى:</small> {activeRide.dropoff_address}</div>
        </div>
        <div style={{ padding: 15, background: '#F8F9FA', borderRadius: 12, marginBottom: 15, textAlign: 'center' }}>
          <strong>السعر: {activeRide.payment_method === 'stars' ? formatStarsPrice(activeRide.stars_price) : formatPrice(activeRide.price)}</strong>
        </div>
        {['pending', 'searching', 'accepted'].includes(activeRide.status) && (
          <button onClick={handleCancel} style={{ width: '100%', padding: 15, background: '#FF3B30', color: 'white', border: 'none', borderRadius: 12 }}>إلغاء الرحلة</button>
        )}
      </div>
      {showRating && targetUserId && (
        <RatingModal
          ride={activeRide}
          userId={user?.id}
          targetUserId={targetUserId}
          targetType={targetType}
          onClose={() => { setShowRating(false); resetRide() }}
          onSuccess={() => { setShowRating(false); resetRide() }}
        />
      )}
    </>
  )
}
