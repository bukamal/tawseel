import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import { hapticFeedback } from '@/lib/telegram'
import { MAP_CONFIG } from '@/utils/constants'

// أيقونات مخصصة
const pickupIcon = new L.Icon({
  iconUrl: '/assets/pickup-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
})
const dropoffIcon = new L.Icon({
  iconUrl: '/assets/dropoff-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
})

// مكون البحث عن العناوين
function AddressSearch({ onSelect, placeholder }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const timeoutRef = useRef(null)

  const handleSearch = (value) => {
    setQuery(value)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (value.length < 3) {
      setResults([])
      return
    }
    timeoutRef.current = setTimeout(() => performSearch(value), 500)
  }

  const performSearch = async (q) => {
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=sy&accept-language=ar`
      )
      const data = await res.json()
      setResults(data)
    } catch (e) {
      console.error('Search failed:', e)
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSelect = (result) => {
    onSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name
    })
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative">
      <Input
        icon="🔍"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <AnimatePresence>
        {searching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-full left-0 right-0 bg-surface border border-border rounded-lg p-4 mt-1 z-10 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <div className="spinner w-4 h-4" />
              <span>جاري البحث...</span>
            </div>
          </motion.div>
        )}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 bg-surface border border-border rounded-lg mt-1 z-10 shadow-lg max-h-72 overflow-y-auto"
          >
            {results.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSelect(result)}
                className="p-3 hover:bg-background cursor-pointer border-b border-border last:border-0"
              >
                <span className="mr-2">📍</span>
                {result.display_name}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// مكون التحكم في الخريطة (السحب والتحديد)
function MapController({ onSelect, markerPosition, setMarkerPosition }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      setMarkerPosition({ lat, lng })
      onSelect({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` })
    }
  })

  useEffect(() => {
    if (markerPosition) {
      map.setView([markerPosition.lat, markerPosition.lng], map.getZoom())
    }
  }, [markerPosition, map])

  return null
}

export default function LocationPicker({ type, initialLocation, onSelect, onClose, currentLocation }) {
  const [markerPosition, setMarkerPosition] = useState(initialLocation)
  const [address, setAddress] = useState(initialLocation?.address || '')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  const center = markerPosition
    ? [markerPosition.lat, markerPosition.lng]
    : currentLocation || MAP_CONFIG.defaultCenter

  const icon = type === 'pickup' ? pickupIcon : dropoffIcon
  const title = type === 'pickup' ? 'حدد نقطة الانطلاق' : 'حدد الوجهة'

  const handleLocationSelect = async (loc) => {
    setMarkerPosition({ lat: loc.lat, lng: loc.lng })
    if (loc.address) {
      setAddress(loc.address)
    } else {
      setIsLoadingAddress(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json&accept-language=ar`
        )
        const data = await res.json()
        setAddress(data.display_name || `${loc.lat}, ${loc.lng}`)
      } catch {
        setAddress(`${loc.lat}, ${loc.lng}`)
      } finally {
        setIsLoadingAddress(false)
      }
    }
  }

  const handleConfirm = () => {
    if (!markerPosition) return
    hapticFeedback('medium')
    onSelect({
      coordinates: [markerPosition.lat, markerPosition.lng],
      address: address || `${markerPosition.lat}, ${markerPosition.lng}`
    })
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
      >
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose} className="!w-auto">
            ←
          </Button>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <div className="p-4">
          <AddressSearch
            onSelect={handleLocationSelect}
            placeholder={type === 'pickup' ? 'ابحث عن نقطة الانطلاق...' : 'ابحث عن الوجهة...'}
          />
        </div>

        <div className="flex-1">
          <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController
              onSelect={handleLocationSelect}
              markerPosition={markerPosition}
              setMarkerPosition={setMarkerPosition}
            />
            {markerPosition && (
              <Marker
                position={[markerPosition.lat, markerPosition.lng]}
                icon={icon}
                draggable
                eventHandlers={{
                  dragend: async (e) => {
                    const { lat, lng } = e.target.getLatLng()
                    handleLocationSelect({ lat, lng })
                  }
                }}
              />
            )}
          </MapContainer>
        </div>

        <AnimatePresence>
          {markerPosition && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-surface border-t border-border p-4 space-y-3"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{type === 'pickup' ? '📍' : '🎯'}</span>
                <p className="flex-1 text-text-secondary">
                  {isLoadingAddress ? 'جاري تحميل العنوان...' : address}
                </p>
              </div>
              <Button variant="primary" size="lg" onClick={handleConfirm}>
                ✅ تأكيد الموقع
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
