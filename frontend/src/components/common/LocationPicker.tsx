import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticFeedback } from '@/lib/telegram'
import type { LocationAddress } from '@/types'

const pickupIcon = new L.Icon({ iconUrl: '/assets/pickup-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] })
const dropoffIcon = new L.Icon({ iconUrl: '/assets/dropoff-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] })

interface LocationPickerProps {
  type: 'pickup' | 'dropoff'
  initialLocation?: { lat: number; lng: number; address: string } | null
  onSelect: (loc: LocationAddress) => void
  onClose: () => void
  currentLocation: [number, number] | null
}

const AddressSearch = ({ onSelect, placeholder }: any) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const search = async (q: string) => {
    if (q.length < 3) return setResults([])
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=sy&accept-language=ar`)
    const data = await res.json()
    setResults(data)
  }
  return (
    <div>
      <input type="text" value={query} onChange={e => { setQuery(e.target.value); search(e.target.value) }} placeholder={placeholder} />
      {results.length > 0 && (
        <div className="search-results">
          {results.map((r: any, i) => <div key={i} onClick={() => { onSelect({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), address: r.display_name }); setQuery(''); setResults([]) }}>{r.display_name}</div>)}
        </div>
      )}
    </div>
  )
}

const MapController = ({ onSelect }: any) => { useMapEvents({ click(e) { onSelect({ lat: e.latlng.lat, lng: e.latlng.lng, address: `${e.latlng.lat},${e.latlng.lng}` }) } }); return null }

export default function LocationPicker({ type, initialLocation, onSelect, onClose, currentLocation }: LocationPickerProps) {
  const [temp, setTemp] = useState(initialLocation)
  const center: [number, number] = temp ? [temp.lat, temp.lng] : (currentLocation || [33.5138, 36.2765])
  const icon = type === 'pickup' ? pickupIcon : dropoffIcon

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="location-picker-modal">
        <div className="header">
          <button onClick={onClose}>←</button>
          <h3>{type === 'pickup' ? 'حدد نقطة الانطلاق' : 'حدد الوجهة'}</h3>
        </div>
        <AddressSearch onSelect={setTemp} placeholder={type === 'pickup' ? 'ابحث عن نقطة الانطلاق' : 'ابحث عن الوجهة'} />
        <div style={{ flex: 1 }}>
          <MapContainer center={center} zoom={15} style={{ height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController onSelect={setTemp} />
            {temp && <Marker draggable position={[temp.lat, temp.lng]} icon={icon} eventHandlers={{ dragend(e) { const m = e.target; const pos = m.getLatLng(); setTemp({ lat: pos.lat, lng: pos.lng, address: `${pos.lat},${pos.lng}` }) } }}><Popup>{temp.address}</Popup></Marker>}
          </MapContainer>
        </div>
        {temp && (
          <div className="footer">
            <p>{temp.address}</p>
            <button onClick={() => { onSelect({ coordinates: [temp.lat, temp.lng], address: temp.address }); onClose() }}>✅ تأكيد</button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
