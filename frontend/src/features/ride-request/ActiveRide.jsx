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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3>{getStatusText(activeRide.status)}</h3>
          <span style={{ background: 'var(--gray-light)', padding: '6px 16px', borderRadius: 30, fontWeight: 600 }}>
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </span>
        </div>
        {activeRide.driver && (
          <div className="request-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: 25, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24 }}>👤</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700 }}>{activeRide.driver.user?.full_name}</p>
              <p style={{ color: 'var(--gray)', fontSize: 14 }}>{activeRide.driver.vehicle_model} ({activeRide.driver.plate_number})</p>
              <p style={{ color: 'var(--gray)', fontSize: 14 }}>⭐ {activeRide.driver.rating}</p>
            </div>
            <a href={`tel:${activeRide.driver.user?.phone}`} style={{ background: 'var(--success)', padding: '10px 16px', borderRadius: 30, color: 'white', textDecoration: 'none' }}>📞</a>
          </div>
        )}
        <div style={{ marginTop: 20 }}>
          <div className="location-card"><span>📍</span> {activeRide.pickup_address}</div>
          <div className="location-card"><span>🎯</span> {activeRide.dropoff_address}</div>
        </div>
        <div className="price-card" style={{ marginTop: 20 }}>
          <div className="price-total">{activeRide.payment_method === 'stars' ? formatStarsPrice(activeRide.stars_price) : formatPrice(activeRide.price)}</div>
        </div>
        {['pending', 'searching', 'accepted'].includes(activeRide.status) && (
          <button className="btn-danger" onClick={handleCancel}>إلغاء الرحلة</button>
        )}
      </div>
      {showRating && targetUserId && (
        <RatingModal ride={activeRide} userId={user?.id} targetUserId={targetUserId} targetType={targetType} onClose={() => { setShowRating(false); resetRide() }} onSuccess={() => { setShowRating(false); resetRide() }} />
      )}
    </>
  )
}
