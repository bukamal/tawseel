import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/app/store'
import { supabase } from '@/lib/supabase'
import Button from '@/components/atoms/Button'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'
import { calculateDistance } from '@/utils/geolocation'
import { api } from '@/lib/api'
import { hapticFeedback } from '@/lib/telegram'

export default function DriverMode({ isAdmin, onOpenAdmin }) {
  const { user, activeRide, setActiveRide, currentLocation } = useAppStore()
  const [isOnline, setIsOnline] = useState(false)
  const [pendingRides, setPendingRides] = useState([])
  const [driverData, setDriverData] = useState(null)
  const [loading, setLoading] = useState(true)

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
    setLoading(true)
    const { data } = await supabase.from('drivers').select('is_verified, is_online, total_rides, balance_stars').eq('id', user.driver_id).single()
    setDriverData(data)
    setIsOnline(data?.is_online || false)
    setLoading(false)
  }

  const toggleOnline = async () => {
    hapticFeedback('medium')
    const newStatus = !isOnline
    await api.drivers.updateStatus({ driver_id: user.driver_id, is_online: newStatus, is_available: newStatus })
    setIsOnline(newStatus)
    if (!newStatus) setPendingRides([])
  }

  const acceptRide = async (rideId) => {
    const data = await api.rides.accept({ ride_id: rideId, driver_id: user.driver_id })
    setActiveRide(data.ride)
    setPendingRides([])
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="spinner" /></div>
  }

  if (!driverData?.is_verified) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
        <div className="text-6xl mb-4">⏳</div>
        <h3 className="text-xl font-bold mb-2">حسابك قيد المراجعة</h3>
        <p className="text-text-secondary mb-6">سنقوم بتفعيل حسابك خلال 24 ساعة</p>
        {isAdmin && <Button variant="secondary" onClick={onOpenAdmin}>👑 توثيق من لوحة التحكم</Button>}
      </motion.div>
    )
  }

  if (activeRide) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <h3 className="text-xl font-bold">🚗 رحلة نشطة</h3>
        <div className="card space-y-3">
          <p><strong>الزبون:</strong> {activeRide.customer?.full_name}</p>
          <p><strong>الهاتف:</strong> <a href={`tel:${activeRide.customer?.phone}`} className="text-primary">{activeRide.customer?.phone}</a></p>
          <div className="text-text-secondary text-sm">
            <p>📍 {activeRide.pickup_address}</p>
            <p>🎯 {activeRide.dropoff_address}</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {activeRide.payment_method === 'stars' ? formatStarsPrice(activeRide.stars_price) : formatPrice(activeRide.price)}
          </p>
        </div>
        <div className="flex gap-2">
          {activeRide.status === 'accepted' && <Button variant="warning" onClick={() => {}}>✅ وصلت للموقع</Button>}
          {activeRide.status === 'arrived' && <Button variant="primary" onClick={() => {}}>🚗 بدأت الرحلة</Button>}
          {activeRide.status === 'picked_up' && <Button variant="success" onClick={() => {}}>✅ اكتملت الرحلة</Button>}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">🚙 وضع السائق</h3>
        <Button
          variant={isOnline ? 'success' : 'danger'}
          size="sm"
          onClick={toggleOnline}
          className="!w-auto"
        >
          {isOnline ? '🟢 متصل' : '🔴 غير متصل'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-text-secondary text-sm">الرحلات</p>
          <p className="text-2xl font-bold">{driverData?.total_rides || 0}</p>
        </div>
        <div className="card text-center">
          <p className="text-text-secondary text-sm">رصيد النجوم</p>
          <p className="text-2xl font-bold text-yellow-500">⭐ {driverData?.balance_stars || 0}</p>
        </div>
      </div>

      <AnimatePresence>
        {isOnline && pendingRides.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <h4 className="font-semibold">طلبات جديدة ({pendingRides.length})</h4>
            {pendingRides.map(ride => (
              <motion.div key={ride.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">{formatPrice(ride.price)}</span>
                  <span className="text-text-secondary">{ride.distance_km} كم</span>
                </div>
                <p className="text-sm text-text-secondary mb-3">{ride.pickup_address}</p>
                <Button variant="primary" onClick={() => acceptRide(ride.id)}>قبول الرحلة</Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isOnline && pendingRides.length === 0 && (
        <p className="text-center text-text-secondary py-8">🕐 في انتظار الطلبات القريبة...</p>
      )}
    </motion.div>
  )
}
