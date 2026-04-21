import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/app/store'
import LocationPicker from '@/components/common/LocationPicker'
import Button from '@/components/atoms/Button'
import { calculateDistance, convertToStars } from '@/utils/geolocation'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'
import { VEHICLE_TYPES } from '@/utils/constants'
import { api } from '@/lib/api'
import { hapticFeedback } from '@/lib/telegram'

export default function RideRequest() {
  const { pickupLocation, dropoffLocation, currentLocation, selectedVehicle, setPickup, setDropoff, setSelectedVehicle, setActiveRide, setNearbyDrivers } = useAppStore()
  const [showPicker, setShowPicker] = useState(null)
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState(null)
  const [estimatedStars, setEstimatedStars] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [distance, setDistance] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [surge, setSurge] = useState(1)

  useEffect(() => {
    if (currentLocation && !pickupLocation) {
      setPickup(currentLocation)
      fetchAddress(currentLocation[0], currentLocation[1]).then(setPickupAddress)
      fetchNearbyDrivers()
    }
  }, [currentLocation])

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const dist = calculateDistance(pickupLocation[0], pickupLocation[1], dropoffLocation[0], dropoffLocation[1])
      setDistance(dist)
      estimatePrice(dist)
    }
  }, [pickupLocation, dropoffLocation, selectedVehicle])

  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`)
      const data = await res.json()
      return data.display_name || 'موقع محدد'
    } catch { return `${lat},${lng}` }
  }

  const fetchNearbyDrivers = async () => {
    if (!currentLocation) return
    const data = await api.drivers.nearby(currentLocation[0], currentLocation[1])
    setNearbyDrivers(data.drivers)
  }

  const estimatePrice = async (dist) => {
    try {
      const data = await api.rides.estimate({
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        vehicle_type: selectedVehicle
      })
      setEstimatedPrice(data.final_price)
      setEstimatedStars(data.stars_price)
      setSurge(data.surge_multiplier || 1)
    } catch {
      const v = VEHICLE_TYPES.find(v => v.id === selectedVehicle)
      const base = v.baseFare + dist * v.perKm
      setEstimatedPrice(Math.round(base))
      setEstimatedStars(convertToStars(base))
    }
  }

  const handleLocationSelected = (type, loc) => {
    if (type === 'pickup') { setPickup(loc.coordinates); setPickupAddress(loc.address) }
    else { setDropoff(loc.coordinates); setDropoffAddress(loc.address) }
  }

  const handleRequest = async () => {
    if (!pickupLocation || !dropoffLocation) return
    hapticFeedback('medium')
    setIsSearching(true)
    try {
      const data = await api.rides.request({
        customer_id: useAppStore.getState().user?.id,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        vehicle_type: selectedVehicle,
        estimated_price: estimatedPrice,
        payment_method: paymentMethod
      })
      if (paymentMethod === 'stars' && data.payment_required) {
        // التعامل مع الدفع عبر Telegram Stars يتم في الـ backend
      } else {
        setActiveRide(data.ride)
      }
    } catch { alert('فشل الطلب') }
    finally { setIsSearching(false) }
  }

  if (isSearching) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: 30, textAlign: 'center' }}>
        <div className="spinner" />
        <p>جاري البحث عن سائق...</p>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 20 }} style={{ padding: 20, overflowY: 'auto', maxHeight: '75dvh' }}>
      <h3 style={{ marginBottom: 20 }}>🚗 اطلب توصيلة</h3>

      <motion.div whileTap={{ scale: 0.98 }} className={`location-card ${pickupLocation ? 'selected' : ''}`} onClick={() => setShowPicker('pickup')}>
        <span>📍</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>نقطة الانطلاق</p>
          <p style={{ color: 'var(--color-gray)', fontSize: 14 }}>{pickupAddress || 'اضغط للتحديد'}</p>
        </div>
      </motion.div>

      <motion.div whileTap={{ scale: 0.98 }} className={`location-card ${dropoffLocation ? 'selected' : ''}`} onClick={() => setShowPicker('dropoff')}>
        <span>🎯</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>الوجهة</p>
          <p style={{ color: 'var(--color-gray)', fontSize: 14 }}>{dropoffAddress || 'اضغط للتحديد'}</p>
        </div>
      </motion.div>

      <div style={{ margin: '20px 0' }}>
        <p style={{ fontWeight: 600, marginBottom: 12 }}>نوع المركبة</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {VEHICLE_TYPES.map(v => (
            <motion.div
              key={v.id}
              whileTap={{ scale: 0.95 }}
              className={`vehicle-card ${selectedVehicle === v.id ? 'active' : ''}`}
              onClick={() => setSelectedVehicle(v.id)}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{v.icon}</div>
              <p style={{ fontWeight: 500 }}>{v.name}</p>
              <small>{v.baseFare} ل.س</small>
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button className={paymentMethod === 'cash' ? 'active' : ''} onClick={() => setPaymentMethod('cash')} style={{ flex: 1, padding: 12, borderRadius: 12, border: paymentMethod === 'cash' ? '2px solid var(--color-primary)' : '1px solid #ccc', background: 'none' }}>💵 نقدي</button>
        <button className={paymentMethod === 'stars' ? 'active' : ''} onClick={() => setPaymentMethod('stars')} style={{ flex: 1, padding: 12, borderRadius: 12, border: paymentMethod === 'stars' ? '2px solid var(--color-primary)' : '1px solid #ccc', background: 'none' }}>⭐ نجوم</button>
      </div>

      <AnimatePresence>
        {estimatedPrice && distance && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="price-card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>المسافة</span><span>{distance.toFixed(1)} كم</span></div>
            {surge > 1 && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warning)' }}><span>⚡ تسعير الذروة</span><span>{surge}x</span></div>}
            <div className="price-total">{paymentMethod === 'stars' ? formatStarsPrice(estimatedStars) : formatPrice(estimatedPrice)}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button variant="primary" onClick={handleRequest} disabled={!pickupLocation || !dropoffLocation}>
        {paymentMethod === 'stars' ? `⭐ ادفع ${estimatedStars} نجمة` : '🔍 ابحث عن سائق'}
      </Button>

      {showPicker && (
        <LocationPicker
          type={showPicker}
          onSelect={(loc) => handleLocationSelected(showPicker, loc)}
          onClose={() => setShowPicker(null)}
          currentLocation={currentLocation}
          initialLocation={showPicker === 'pickup' ? (pickupLocation ? { lat: pickupLocation[0], lng: pickupLocation[1], address: pickupAddress } : null) : (dropoffLocation ? { lat: dropoffLocation[0], lng: dropoffLocation[1], address: dropoffAddress } : null)}
        />
      )}
    </motion.div>
  )
}
