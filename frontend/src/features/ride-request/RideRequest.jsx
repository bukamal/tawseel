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
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

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
      setActiveRide(data.ride)
    } catch {
      alert('فشل الطلب')
    } finally {
      setIsSearching(false)
    }
  }

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="spinner mb-4" />
        <p className="text-text-secondary">جاري البحث عن سائق قريب...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">🚗 اطلب توصيلة</h3>

      <motion.div
        whileTap={{ scale: 0.99 }}
        className={`location-card ${pickupLocation ? 'selected' : ''}`}
        onClick={() => setShowPicker('pickup')}
      >
        <span className="emoji">📍</span>
        <div className="content">
          <p className="title">نقطة الانطلاق</p>
          <p className="address">{pickupAddress || 'اضغط للتحديد'}</p>
        </div>
      </motion.div>

      <motion.div
        whileTap={{ scale: 0.99 }}
        className={`location-card ${dropoffLocation ? 'selected' : ''}`}
        onClick={() => setShowPicker('dropoff')}
      >
        <span className="emoji">🎯</span>
        <div className="content">
          <p className="title">الوجهة</p>
          <p className="address">{dropoffAddress || 'اضغط للتحديد'}</p>
        </div>
      </motion.div>

      <div>
        <p className="font-semibold mb-3">نوع المركبة</p>
        <div className="vehicle-grid">
          {VEHICLE_TYPES.map(v => (
            <motion.div
              key={v.id}
              whileTap={{ scale: 0.95 }}
              className={`vehicle-card ${selectedVehicle === v.id ? 'active' : ''}`}
              onClick={() => setSelectedVehicle(v.id)}
            >
              <div className="icon">{v.icon}</div>
              <p className="name">{v.name}</p>
              <p className="price">{v.baseFare} ل.س</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`flex-1 py-3 rounded-full font-medium border transition-all ${paymentMethod === 'cash' ? 'bg-primary text-white border-primary' : 'bg-surface text-text-primary border-border'}`}
          onClick={() => setPaymentMethod('cash')}
        >
          💵 نقدي
        </button>
        <button
          className={`flex-1 py-3 rounded-full font-medium border transition-all ${paymentMethod === 'stars' ? 'bg-primary text-white border-primary' : 'bg-surface text-text-primary border-border'}`}
          onClick={() => setPaymentMethod('stars')}
        >
          ⭐ نجوم
        </button>
      </div>

      <AnimatePresence>
        {estimatedPrice && distance && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="price-card"
          >
            <div className="price-row"><span>المسافة</span><span>{distance.toFixed(1)} كم</span></div>
            {surge > 1 && (
              <div className="price-row text-warning"><span>⚡ تسعير الذروة</span><span>{surge}x</span></div>
            )}
            <div className="price-total">
              {paymentMethod === 'stars' ? formatStarsPrice(estimatedStars) : formatPrice(estimatedPrice)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="primary"
        size="lg"
        onClick={handleRequest}
        disabled={!pickupLocation || !dropoffLocation}
      >
        {paymentMethod === 'stars' ? `⭐ ادفع ${estimatedStars} نجمة` : '🔍 ابحث عن سائق'}
      </Button>

      {showPicker && (
        <LocationPicker
          type={showPicker}
          onSelect={(loc) => handleLocationSelected(showPicker, loc)}
          onClose={() => setShowPicker(null)}
          currentLocation={currentLocation}
          initialLocation={
            showPicker === 'pickup'
              ? pickupLocation ? { lat: pickupLocation[0], lng: pickupLocation[1], address: pickupAddress } : null
              : dropoffLocation ? { lat: dropoffLocation[0], lng: dropoffLocation[1], address: dropoffAddress } : null
          }
        />
      )}
    </div>
  )
}
