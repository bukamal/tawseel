import { useState, useEffect } from 'react'
import { useAppStore } from '@/app/store'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/utils/formatters'
import { calculateDistance } from '@/utils/geolocation'

export default function DriverMode({ isAdmin, onOpenAdmin }) {
  const { user, setActiveRide, currentLocation } = useAppStore()
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

  if (!driverData?.is_verified) {
    return (
      <div className="driver-verification">
        <h3>⏳ حسابك قيد المراجعة</h3>
        <p>سنقوم بتفعيل حسابك خلال 24 ساعة</p>
        {isAdmin && <button onClick={onOpenAdmin}>👑 توثيق من لوحة التحكم</button>}
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3>🚙 وضع السائق</h3>
        <button onClick={toggleOnline} style={{ padding: 10, background: isOnline ? '#34C759' : '#FF3B30', color: 'white', border: 'none', borderRadius: 8 }}>
          {isOnline ? '🟢 متصل' : '🔴 غير متصل'}
        </button>
      </div>
      {isOnline && pendingRides.length > 0 && (
        <div>
          <h4>طلبات جديدة ({pendingRides.length})</h4>
          {pendingRides.map(ride => (
            <div key={ride.id} style={{ background: '#f0f0f0', padding: 15, borderRadius: 12, marginBottom: 10 }}>
              <p>💰 {formatPrice(ride.price)}</p>
              <p>📍 {ride.pickup_address}</p>
              <button onClick={() => acceptRide(ride.id)} style={{ background: '#007AFF', color: 'white', border: 'none', padding: 10, borderRadius: 8, width: '100%' }}>قبول</button>
            </div>
          ))}
        </div>
      )}
      {isOnline && pendingRides.length === 0 && <p>🕐 في انتظار الطلبات...</p>}
    </div>
  )
}
