import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/app/store'
import LocationPicker from '@/components/common/LocationPicker'
import { VEHICLE_TYPES } from '@/utils/constants'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'
import { calculateDistance, convertToStars } from '@/utils/geolocation'
import { hapticFeedback } from '@/lib/telegram'
import type { LocationAddress } from '@/types'

export default function RideRequest() {
  const { pickupLocation, dropoffLocation, currentLocation, selectedVehicle, setPickup, setDropoff, setSelectedVehicle, setActiveRide, setNearbyDrivers } = useAppStore()
  const [isSearching, setIsSearching] = useState(false)
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [estimatedStars, setEstimatedStars] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'stars'>('cash')
  const [distance, setDistance] = useState<number | null>(null)
  const [surge, setSurge] = useState(1)
  const [showPicker, setShowPicker] = useState<'pickup' | 'dropoff' | null>(null)
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => { if (pickupLocation && dropoffLocation) estimatePrice() }, [pickupLocation, dropoffLocation, selectedVehicle])
  useEffect(() => { if (currentLocation && !pickupLocation) { setPickup(currentLocation); fetchAddress(currentLocation[0], currentLocation[1]).then(setPickupAddress); fetchNearbyDrivers() } }, [currentLocation])

  const fetchAddress = async (lat: number, lng: number) => {
    try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`); const data = await res.json(); return data.display_name || 'موقع محدد' }
    catch { return `${lat},${lng}` }
  }

  const estimatePrice = async () => {
    if (!pickupLocation || !dropoffLocation) return
    const dist = calculateDistance(pickupLocation[0], pickupLocation[1], dropoffLocation[0], dropoffLocation[1])
    setDistance(dist)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/rides/estimate_price`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pickup_location: pickupLocation, dropoff_location: dropoffLocation, vehicle_type: selectedVehicle }) })
      const data = await res.json()
      setEstimatedPrice(data.final_price); setEstimatedStars(data.stars_price); setSurge(data.surge_multiplier)
    } catch { const v = VEHICLE_TYPES.find(v => v.id === selectedVehicle)!; const price = v.baseFare + dist * v.perKm; setEstimatedPrice(Math.round(price)); setEstimatedStars(convertToStars(price)) }
  }

  const fetchNearbyDrivers = async () => { if (!currentLocation) return; const res = await fetch(`${import.meta.env.VITE_API_URL}/api/drivers/nearby?lat=${currentLocation[0]}&lng=${currentLocation[1]}`); const data = await res.json(); setNearbyDrivers(data.drivers) }

  const handleLocationSelected = (type: 'pickup' | 'dropoff', loc: LocationAddress) => { if (type === 'pickup') { setPickup(loc.coordinates); setPickupAddress(loc.address) } else { setDropoff(loc.coordinates); setDropoffAddress(loc.address) } }

  const handleRequest = async () => {
    if (!pickupLocation || !dropoffLocation) return
    hapticFeedback('medium'); setIsSearching(true)
    try {
      const body: any = { customer_id: useAppStore.getState().user!.id, pickup_location: pickupLocation, dropoff_location: dropoffLocation, pickup_address: pickupAddress, dropoff_address: dropoffAddress, vehicle_type: selectedVehicle, estimated_price: estimatedPrice, payment_method: paymentMethod }
      if (isScheduled) body.scheduled_for = `${scheduledDate}T${scheduledTime}`
      const endpoint = isScheduled ? '/api/rides/schedule' : '/api/rides/request'
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (isScheduled) { alert('✅ تم الجدولة'); setIsSearching(false) }
      else if (paymentMethod === 'stars' && data.payment_required) setIsSearching(false)
      else setActiveRide(data.ride)
    } catch { setIsSearching(false) }
  }

  if (isSearching) return <div className="loading"><div className="spinner"/><p>جاري البحث...</p></div>

  return (
    <>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="ride-request">
        <h3>🚗 اطلب توصيلة</h3>
        <div className="location-selector" onClick={() => setShowPicker('pickup')}><span>📍</span><div><p>نقطة الانطلاق</p><p>{pickupAddress || 'اضغط للتحديد'}</p></div></div>
        {pickupLocation && dropoffLocation && <button className="swap-btn" onClick={() => { const t = pickupLocation; setPickup(dropoffLocation); setDropoff(t) }}>🔄</button>}
        <div className="location-selector" onClick={() => setShowPicker('dropoff')}><span>🎯</span><div><p>الوجهة</p><p>{dropoffAddress || 'اضغط للتحديد'}</p></div></div>
        <div className="vehicle-types">{VEHICLE_TYPES.map(v => <button key={v.id} className={selectedVehicle === v.id ? 'active' : ''} onClick={() => setSelectedVehicle(v.id)}>{v.icon} {v.name}</button>)}</div>
        <div className="payment-methods"><button className={paymentMethod === 'cash' ? 'active' : ''} onClick={() => setPaymentMethod('cash')}>💵 نقدي</button><button className={paymentMethod === 'stars' ? 'active' : ''} onClick={() => setPaymentMethod('stars')}>⭐ نجوم</button></div>
        <label><input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} /> 📅 جدولة</label>
        {isScheduled && <div className="schedule-inputs"><input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} /><input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} /></div>}
        {estimatedPrice && distance && <div className="price-estimate"><span>المسافة: {distance.toFixed(1)} كم</span>{surge > 1 && <span className="surge">⚡ ذروة {surge}x</span>}<span className="price">{paymentMethod === 'stars' ? formatStarsPrice(estimatedStars!) : formatPrice(estimatedPrice)}</span></div>}
        <button className="btn-primary" onClick={handleRequest} disabled={!pickupLocation || !dropoffLocation}>طلب الرحلة</button>
      </motion.div>
      {showPicker && <LocationPicker type={showPicker} onSelect={(loc) => handleLocationSelected(showPicker, loc)} onClose={() => setShowPicker(null)} currentLocation={currentLocation} initialLocation={showPicker === 'pickup' ? (pickupLocation ? { lat: pickupLocation[0], lng: pickupLocation[1], address: pickupAddress } : null) : (dropoffLocation ? { lat: dropoffLocation[0], lng: dropoffLocation[1], address: dropoffAddress } : null)} />}
    </>
  )
}
