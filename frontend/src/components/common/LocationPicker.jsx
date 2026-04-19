import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { hapticFeedback } from '@/lib/telegram'

const pickupIcon = new L.Icon({ iconUrl: '/assets/pickup-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] })
const dropoffIcon = new L.Icon({ iconUrl: '/assets/dropoff-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] })

const AddressSearch = ({ onSelect, placeholder }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const search = async (q) => {
    if (q.length < 3) return setResults([])
    setSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=sy&accept-language=ar`)
      setResults(await res.json())
    } finally { setSearching(false) }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); search(e.target.value) }}
        placeholder={placeholder}
        style={{ width: '100%', padding: 14, border: '1px solid #E0E0E0', borderRadius: 12 }}
      />
      <AnimatePresence>
        {searching && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', top: '100%', background: 'white', padding: 12, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000 }}>
            جاري البحث...
          </motion.div>
        )}
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', top: '100%', background: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: 300, overflowY: 'auto' }}>
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => { onSelect({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name }); setQuery(''); setResults([]) }}
                style={{ padding: 12, borderBottom: '1px solid #F0F0F0', cursor: 'pointer' }}
              >
                <span>📍</span> {r.display_name}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MapController = ({ onSelect }) => { useMapEvents({ click(e) { onSelect({ lat: e.latlng.lat, lng: e.latlng.lng, address: `${e.latlng.lat},${e.latlng.lng}` }) } }); return null }

export default function LocationPicker({ type, initialLocation, onSelect, onClose, currentLocation }) {
  const [temp, setTemp] = useState(initialLocation)
  const center = temp ? [temp.lat, temp.lng] : (currentLocation || [33.5138, 36.2765])
  const icon = type === 'pickup' ? pickupIcon : dropoffIcon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 2000, display: 'flex', flexDirection: 'column' }}
      >
        <motion.div initial={{ y: -50 }} animate={{ y: 0 }} style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onClose}>←</button>
          <h3>{type === 'pickup' ? 'حدد نقطة الانطلاق' : 'حدد الوجهة'}</h3>
        </motion.div>
        <div style={{ padding: 16 }}>
          <AddressSearch onSelect={setTemp} placeholder={type === 'pickup' ? 'ابحث عن نقطة الانطلاق...' : 'ابحث عن الوجهة...'} />
        </div>
        <div style={{ flex: 1 }}>
          <MapContainer center={center} zoom={15} style={{ height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController onSelect={setTemp} />
            {temp && (
              <Marker
                position={[temp.lat, temp.lng]}
                icon={icon}
                draggable
                eventHandlers={{
                  dragend(e) {
                    const m = e.target
                    const pos = m.getLatLng()
                    setTemp({ lat: pos.lat, lng: pos.lng, address: `${pos.lat},${pos.lng}` })
                  }
                }}
              />
            )}
          </MapContainer>
        </div>
        <AnimatePresence>
          {temp && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              style={{ padding: 16, background: '#F8F9FA', borderTop: '1px solid #eee' }}
            >
              <p>{temp.address}</p>
              <button
                onClick={() => { hapticFeedback('medium'); onSelect({ coordinates: [temp.lat, temp.lng], address: temp.address }); onClose() }}
                style={{ width: '100%', padding: 16, background: '#007AFF', color: 'white', border: 'none', borderRadius: 12 }}
              >
                ✅ تأكيد الموقع
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
