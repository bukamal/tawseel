import { useState, useEffect } from 'react'
import { useAppStore } from '@/app/store'
import LocationPicker from '@/components/common/LocationPicker'
import { calculateDistance, convertToStars } from '@/utils/geolocation'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'

export default function RideRequest() {
  const { pickupLocation, dropoffLocation, currentLocation, selectedVehicle, setPickup, setDropoff, setSelectedVehicle, setActiveRide } = useAppStore()
  const [showPicker, setShowPicker] = useState(null)
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  useEffect(() => {
    if (currentLocation && !pickupLocation) {
      setPickup(currentLocation)
      fetchAddress(currentLocation[0], currentLocation[1]).then(setPickupAddress)
    }
  }, [currentLocation])

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const dist = calculateDistance(pickupLocation[0], pickupLocation[1], dropoffLocation[0], dropoffLocation[1])
      const price = 10 + dist * 2 // تقدير بسيط
      setEstimatedPrice(Math.round(price))
    }
  }, [pickupLocation, dropoffLocation])

  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`)
      const data = await res.json()
      return data.display_name || 'موقع محدد'
    } catch { return `${lat},${lng}` }
  }

  const handleLocationSelected = (type, loc) => {
    if (type === 'pickup') { setPickup(loc.coordinates); setPickupAddress(loc.address) }
    else { setDropoff(loc.coordinates); setDropoffAddress(loc.address) }
  }

  const handleRequest = async () => {
    if (!pickupLocation || !dropoffLocation) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rides/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: useAppStore.getState().user?.id,
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          vehicle_type: selectedVehicle,
          estimated_price: estimatedPrice,
          payment_method: paymentMethod
        })
      })
      const data = await res.json()
      setActiveRide(data.ride)
    } catch (e) { alert('فشل الطلب') }
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>🚗 اطلب توصيلة</h3>
      <div onClick={() => setShowPicker('pickup')} style={{ padding: 15, background: pickupLocation ? '#E3F2FD' : '#F5F5F5', borderRadius: 12, marginBottom: 10 }}>
        <span>📍</span> {pickupAddress || 'اضغط لتحديد نقطة الانطلاق'}
      </div>
      <div onClick={() => setShowPicker('dropoff')} style={{ padding: 15, background: dropoffLocation ? '#FFEBEE' : '#F5F5F5', borderRadius: 12, marginBottom: 10 }}>
        <span>🎯</span> {dropoffAddress || 'اضغط لتحديد الوجهة'}
      </div>
      {estimatedPrice && (
        <div style={{ padding: 15, background: '#F0F0F0', borderRadius: 12, marginBottom: 10 }}>
          السعر التقديري: {formatPrice(estimatedPrice)}
        </div>
      )}
      <button onClick={handleRequest} disabled={!pickupLocation || !dropoffLocation} style={{ width: '100%', padding: 15, background: '#007AFF', color: 'white', border: 'none', borderRadius: 12 }}>
        اطلب الآن
      </button>
      {showPicker && (
        <LocationPicker
          type={showPicker}
          onSelect={(loc) => handleLocationSelected(showPicker, loc)}
          onClose={() => setShowPicker(null)}
          currentLocation={currentLocation}
          initialLocation={showPicker === 'pickup' ? (pickupLocation ? { lat: pickupLocation[0], lng: pickupLocation[1], address: pickupAddress } : null) : (dropoffLocation ? { lat: dropoffLocation[0], lng: dropoffLocation[1], address: dropoffAddress } : null)}
        />
      )}
    </div>
  )
}
