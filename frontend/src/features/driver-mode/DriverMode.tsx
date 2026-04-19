import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/app/store'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'
import { calculateDistance } from '@/utils/geolocation'
import { hapticFeedback } from '@/lib/telegram'
import type { Ride } from '@/types'

interface DriverModeProps { isAdmin?: boolean; onOpenAdmin?: () => void }

export default function DriverMode({ isAdmin, onOpenAdmin }: DriverModeProps) {
  const { user, activeRide, setActiveRide, currentLocation } = useAppStore()
  const [isOnline, setIsOnline] = useState(false)
  const [stats, setStats] = useState({ total: 0, balance: 0 })
  const [pending, setPending] = useState<Ride[]>([])
  const [driverData, setDriverData] = useState<any>(null)

  useEffect(() => { if (user?.driver_id) fetchDriverData() }, [user])
  useEffect(() => {
    if (!isOnline) return
    const channel = supabase.channel('new-rides').on('postgres_changes', { event:'INSERT', schema:'public', table:'rides', filter:'status=eq.searching' }, (payload) => {
      const ride = payload.new as Ride
      if (currentLocation) {
        const dist = calculateDistance(currentLocation[0], currentLocation[1], ride.pickup_location.lat, ride.pickup_location.lng)
        if (dist <= 10) setPending(prev => prev.find(r=>r.id===ride.id) ? prev : [ride, ...prev])
      }
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isOnline, currentLocation])

  const fetchDriverData = async () => {
    const { data } = await supabase.from('drivers').select('is_verified, total_rides, balance_stars').eq('id', user!.driver_id).single()
    setDriverData(data)
    setStats({ total: data?.total_rides||0, balance: data?.balance_stars||0 })
  }

  const toggleOnline = async () => {
    hapticFeedback('medium')
    const newStatus = !isOnline
    await fetch(`${import.meta.env.VITE_API_URL}/api/drivers/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver_id: user!.driver_id, is_online: newStatus, is_available: newStatus })
    })
    setIsOnline(newStatus)
    if (!newStatus) setPending([])
  }

  const acceptRide = async (rideId: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rides/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride_id: rideId, driver_id: user!.driver_id })
    })
    const data = await res.json()
    setActiveRide(data.ride)
    setPending([])
  }

  if (!driverData?.is_verified) {
    return (
      <motion.div initial={{y:100}} animate={{y:0}} className="driver-verification">
        <div>⏳</div>
        <h3>حسابك قيد المراجعة</h3>
        {isAdmin && <button onClick={onOpenAdmin}>👑 توثيق من لوحة التحكم</button>}
      </motion.div>
    )
  }

  if (activeRide) {
    return (
      <motion.div initial={{y:100}} animate={{y:0}} className="active-ride">
        <h3>🚗 رحلة نشطة</h3>
        <p>الزبون: {activeRide.customer?.full_name}</p>
        <p>السعر: {activeRide.payment_method==='stars'?formatStarsPrice(activeRide.stars_price!):formatPrice(activeRide.price)}</p>
        {/* أزرار تغيير الحالة */}
      </motion.div>
    )
  }

  return (
    <motion.div initial={{y:100}} animate={{y:0}} className="driver-mode">
      <div className="header">
        <h3>وضع السائق</h3>
        <button onClick={toggleOnline} className={isOnline?'online':'offline'}>{isOnline?'🟢 متصل':'🔴 غير متصل'}</button>
      </div>
      <div className="stats">
        <div>الرحلات: {stats.total}</div>
        <div>⭐ {stats.balance}</div>
      </div>
      {isOnline && pending.length>0 && (
        <div className="pending">
          <h4>طلبات جديدة</h4>
          {pending.map(ride=> (
            <div key={ride.id} className="request-card">
              <span>{formatPrice(ride.price)}</span>
              <button onClick={()=>acceptRide(ride.id)}>قبول</button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
