import { useState, useEffect } from 'react'
import { useAppStore } from '@/app/store'
import LocationPicker from '@/components/common/LocationPicker'
import { calculateDistance, convertToStars } from '@/utils/geolocation'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'
import { hapticFeedback } from '@/lib/telegram'

export default function RideRequest() {
  const { pickupLocation, dropoffLocation, currentLocation, selectedVehicle, setPickup, setDropoff, setSelectedVehicle, setActiveRide } = useAppStore()
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

  const estimatePrice = async (dist) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rides/estimate_price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup_location: pickupLocation, dropoff_location: dropoffLocation, vehicle_type: selectedVehicle })
      })
      const data = await res.json()
      setEstimatedPrice(data.final_price)
      setEstimatedStars(data.stars_price)
      setSurge(data.surge_multiplier || 1)
    } catch {
      const base = 10 + dist * 2
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
    if (isScheduled && (!scheduledDate || !scheduledTime)) return alert('الرجاء تحديد وقت الجدولة')
    hapticFeedback('medium')
    setIsSearching(true)
    try {
      const endpoint = isScheduled ? '/api/rides/schedule' : '/api/rides/request'
      const body = {
        customer_id: useAppStore.getState().user?.id,
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        vehicle_type: selectedVehicle,
        estimated_price: estimatedPrice,
        payment_method: paymentMethod
      }
      if (isScheduled) body.scheduled_for = `${scheduledDate}T${scheduledTime}:00`
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (isScheduled) {
        hapticFeedback('success')
        alert(`✅ تم جدولة الرحلة بنجاح!\nالتاريخ: ${scheduledDate}\nالوقت: ${scheduledTime}`)
        setIsSearching(false)
      } else if (paymentMethod === 'stars' && data.payment_required) {
        setIsSearching(false)
      } else {
        setActiveRide(data.ride)
      }
    } catch (e) { alert('فشل الطلب') }
    finally { setIsSearching(false) }
  }

  if (isSearching) return <div style={{ padding: 30, textAlign: 'center' }}><div className="spinner" /><p>جاري البحث عن سائق...</p></div>

  return (
    <div style={{ padding: 20 }}>
      <h3>🚗 اطلب توصيلة</h3>
      <div onClick={() => setShowPicker('pickup')} style={{ padding: 15, background: pickupLocation ? '#E3F2FD' : '#F5F5F5', borderRadius: 12, marginBottom: 10 }}>
        <span>📍</span> {pickupAddress || 'اضغط لتحديد نقطة الانطلاق'}
      </div>
      <div onClick={() => setShowPicker('dropoff')} style={{ padding: 15, background: dropoffLocation ? '#FFEBEE' : '#F5F5F5', borderRadius: 12, marginBottom: 10 }}>
        <span>🎯</span> {dropoffAddress || 'اضغط لتحديد الوجهة'}
      </div>
      
      <div style={{ marginBottom: 15 }}>
        <p>طريقة الدفع:</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setPaymentMethod('cash')} style={{ flex: 1, padding: 12, background: paymentMethod === 'cash' ? '#007AFF' : '#F5F5F5', color: paymentMethod === 'cash' ? 'white' : 'black', border: 'none', borderRadius: 8 }}>💵 نقدي</button>
          <button onClick={() => setPaymentMethod('stars')} style={{ flex: 1, padding: 12, background: paymentMethod === 'stars' ? '#FFB800' : '#F5F5F5', color: paymentMethod === 'stars' ? 'white' : 'black', border: 'none', borderRadius: 8 }}>⭐ نجوم</button>
        </div>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} /> 📅 جدولة الرحلة لوقت لاحق
        </label>
        {isScheduled && (
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
            <input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 8 }} />
          </div>
        )}
      </div>

      {estimatedPrice && distance && (
        <div style={{ padding: 15, background: '#F8F9FA', borderRadius: 12, marginBottom: 15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>المسافة:</span><span>{distance.toFixed(1)} كم</span></div>
          {surge > 1 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#FF9800' }}><span>⚡ ذروة {surge}x</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>السعر:</span><strong>{paymentMethod === 'stars' ? formatStarsPrice(estimatedStars) : formatPrice(estimatedPrice)}</strong></div>
        </div>
      )}

      <button onClick={handleRequest} disabled={!pickupLocation || !dropoffLocation} style={{ width: '100%', padding: 15, background: '#007AFF', color: 'white', border: 'none', borderRadius: 12 }}>
        {isScheduled ? '📅 جدولة الرحلة' : paymentMethod === 'stars' ? `⭐ ادفع ${estimatedStars} نجمة` : '🔍 ابحث عن سائق'}
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
