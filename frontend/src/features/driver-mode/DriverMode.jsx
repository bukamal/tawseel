import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/app/store'
import { supabase } from '@/lib/supabase'
import Button from '@/components/atoms/Button'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'
import { calculateDistance } from '@/utils/geolocation'

export default function DriverMode({ isAdmin, onOpenAdmin }) {
  const { user, activeRide, setActiveRide, currentLocation } = useAppStore()
  const [isOnline, setIsOnline] = useState(false)
  const [pendingRides, setPendingRides] = useState([])
  const [driverData, setDriverData] = useState(null)

  useEffect(() => {
    if (!user?.driver_id) return
    fetchDriverData()
    const channel = supabase
      .channel('new-rides')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides', filter: 'status=eq.searching' }, payload => {
        const ride = payload.new
        if (currentLocation) {
          const dist = calculateDistance(currentLocation[0], currentLocation[1], ride.pickup_location.coordinates[1], ride.pickup_location.coordinates[0])
          if (dist <= 10) setPendingRides(prev => [ride, ...prev.filter(r => r.id !== ride.id)])
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, currentLocation])

  const fetchDriverData = async () => {
    const { data } = await supabase.from('drivers').select('is_verified, is_online, total_rides, balance_stars').eq('id', user.driver_id).single()
    setDriverData(data)
    setIsOnline(data?.is_online || false)
  }

  const toggleOnline = async () => {
    const newStatus = !isOnline
    await fetch(`${import.meta.env.VITE_API_URL}/api/drivers/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: user.driver_id, is_online: newStatus, is_available: newStatus })
    })
    setIsOnline(newStatus)
  }

  const acceptRide = async (rideId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rides/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride_id: rideId, driver_id: user.driver_id })
    })
    const data = await res.json()
    setActiveRide(data.ride)
    setPendingRides([])
  }

  const updateRideStatus = async (status) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/rides/${activeRide.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    if (status === 'completed') {
      setActiveRide(null)
      fetchDriverData()
    } else {
      setActiveRide({ ...activeRide, status })
    }
  }

  if (!driverData?.is_verified) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="driver-verification">
        <div style={{ fontSize: 56, marginBottom: 20 }}>⏳</div>
        <h3 style={{ marginBottom: 12 }}>حسابك قيد المراجعة</h3>
        <p style={{ color: 'var(--color-gray)', marginBottom: 20 }}>سنقوم بتفعيل حسابك خلال 24 ساعة</p>
        {isAdmin && <Button variant="secondary" onClick={onOpenAdmin}>👑 توثيق من لوحة التحكم</Button>}
      </motion.div>
    )
  }

  if (activeRide) {
    return (
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 20 }}>🚗 رحلة نشطة</h3>
        <div className="request-card">
          <p><strong>الزبون:</strong> {activeRide.customer?.full_name}</p>
          <p><strong>الهاتف:</strong> <a href={`tel:${activeRide.customer?.phone}`} style={{ color: 'var(--color-primary)' }}>{activeRide.customer?.phone}</a></p>
          <div style={{ marginTop: 16 }}>
            <p style={{ color: 'var(--color-gray)' }}>من: {activeRide.pickup_address}</p>
            <p style={{ color: 'var(--color-gray)' }}>إلى: {activeRide.dropoff_address}</p>
          </div>
          <p style={{ fontSize: 24, fontWeight: 700, marginTop: 16, color: 'var(--color-primary)' }}>
            {activeRide.payment_method === 'stars' ? formatStarsPrice(activeRide.stars_price) : formatPrice(activeRide.price)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          {activeRide.status === 'accepted' && <Button variant="warning" onClick={() => updateRideStatus('arrived')}>✅ وصلت للموقع</Button>}
          {activeRide.status === 'arrived' && <Button variant="primary" onClick={() => updateRideStatus('picked_up')}>🚗 بدأت الرحلة</Button>}
          {activeRide.status === 'picked_up' && <Button variant="success" onClick={() => updateRideStatus('completed')}>✅ اكتملت الرحلة</Button>}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ padding: 20 }}>
      <div className="driver-header">
        <h3>🚙 وضع السائق</h3>
        <Button
          variant={isOnline ? 'success' : 'danger'}
          size="sm"
          onClick={toggleOnline}
        >
          {isOnline ? '🟢 متصل' : '🔴 غير متصل'}
        </Button>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><p style={{ color: 'var(--color-gray)' }}>الرحلات</p><h4>{driverData?.total_rides || 0}</h4></div>
        <div className="stat-card"><p style={{ color: 'var(--color-gray)' }}>رصيد النجوم</p><h4 style={{ color: '#FFB800' }}>⭐ {driverData?.balance_stars || 0}</h4></div>
      </div>
      <AnimatePresence>
        {isOnline && pendingRides.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h4 style={{ marginBottom: 16 }}>طلبات جديدة ({pendingRides.length})</h4>
            {pendingRides.map(ride => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="request-card"
              >
                {ride.surge_multiplier > 1 && <span className="surge-badge">⚡ ذروة {ride.surge_multiplier}x</span>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{formatPrice(ride.price)}</span>
                  <span style={{ color: 'var(--color-gray)' }}>{ride.distance_km} كم</span>
                </div>
                <p style={{ marginBottom: 16 }}>{ride.pickup_address}</p>
                <Button variant="primary" onClick={() => acceptRide(ride.id)}>قبول الرحلة</Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {isOnline && pendingRides.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-gray)', padding: 40 }}>🕐 في انتظار الطلبات...</p>}
    </motion.div>
  )
}
