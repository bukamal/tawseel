import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pickupIcon = new L.Icon({ iconUrl: '/assets/pickup-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] })
const dropoffIcon = new L.Icon({ iconUrl: '/assets/dropoff-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] })

const MapController = ({ onSelect }) => {
  useMapEvents({ click(e) { onSelect({ lat: e.latlng.lat, lng: e.latlng.lng, address: `${e.latlng.lat},${e.latlng.lng}` }) } })
  return null
}

export default function LocationPicker({ type, initialLocation, onSelect, onClose, currentLocation }) {
  const [temp, setTemp] = useState(initialLocation)
  const center = temp ? [temp.lat, temp.lng] : (currentLocation || [33.5138, 36.2765])
  const icon = type === 'pickup' ? pickupIcon : dropoffIcon

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose}>←</button>
        <h3>{type === 'pickup' ? 'حدد نقطة الانطلاق' : 'حدد الوجهة'}</h3>
      </div>
      <div style={{ flex: 1 }}>
        <MapContainer center={center} zoom={15} style={{ height: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapController onSelect={setTemp} />
          {temp && <Marker position={[temp.lat, temp.lng]} icon={icon} draggable eventHandlers={{ dragend(e) { const m = e.target; const pos = m.getLatLng(); setTemp({ lat: pos.lat, lng: pos.lng, address: `${pos.lat},${pos.lng}` }) } }} />}
        </MapContainer>
      </div>
      {temp && (
        <div style={{ padding: 16, background: '#F8F9FA', borderTop: '1px solid #eee' }}>
          <p>{temp.address}</p>
          <button onClick={() => { onSelect({ coordinates: [temp.lat, temp.lng], address: temp.address }); onClose() }} style={{ width: '100%', padding: 16, background: '#007AFF', color: 'white', border: 'none', borderRadius: 12 }}>✅ تأكيد</button>
        </div>
      )}
    </div>
  )
}
