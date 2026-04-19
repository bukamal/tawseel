import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '@/app/store'

// إصلاح أيقونات Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const pickupIcon = new L.Icon({ iconUrl: '/assets/pickup-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] })
const dropoffIcon = new L.Icon({ iconUrl: '/assets/dropoff-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] })

export default function Map() {
  const { currentLocation, pickupLocation, dropoffLocation } = useAppStore()
  const defaultCenter = [33.5138, 36.2765] // دمشق

  const center = pickupLocation || currentLocation || defaultCenter

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {currentLocation && <Circle center={currentLocation} radius={30} pathOptions={{ color: '#007AFF', fillColor: '#007AFF', fillOpacity: 0.2 }} />}
      {pickupLocation && <Marker position={pickupLocation} icon={pickupIcon}><Popup>نقطة الانطلاق</Popup></Marker>}
      {dropoffLocation && <Marker position={dropoffLocation} icon={dropoffIcon}><Popup>الوجهة</Popup></Marker>}
    </MapContainer>
  )
}
