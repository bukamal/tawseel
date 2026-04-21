import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppStore } from '@/app/store'
import { MAP_CONFIG } from '@/utils/constants'

// إصلاح أيقونات Leaflet الافتراضية
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const driverIcon = new L.Icon({
  iconUrl: '/assets/driver-marker.svg',
  iconSize: [48, 48],
  iconAnchor: [24, 48],
  popupAnchor: [0, -40]
})
const pickupIcon = new L.Icon({
  iconUrl: '/assets/pickup-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35]
})
const dropoffIcon = new L.Icon({
  iconUrl: '/assets/dropoff-marker.svg',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35]
})

// مكون للتحكم في الخريطة (التنقل التلقائي)
const MapController = ({ center, zoom }) => {
  const map = useMap()
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

export default function Map() {
  const { currentLocation, pickupLocation, dropoffLocation, nearbyDrivers, activeRide, user } = useAppStore()
  const mapRef = useRef(null)

  const mapCenter = useMemo(() => {
    if (pickupLocation) return pickupLocation
    if (currentLocation && currentLocation[0] !== 0) return currentLocation
    return MAP_CONFIG.defaultCenter
  }, [pickupLocation, currentLocation])

  const routePoints = useMemo(() => {
    if (pickupLocation && dropoffLocation) return [pickupLocation, dropoffLocation]
    return []
  }, [pickupLocation, dropoffLocation])

  // ضبط حدود الخريطة تلقائياً لتشمل جميع النقاط
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const points = [pickupLocation, dropoffLocation, currentLocation].filter(Boolean)
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [pickupLocation, dropoffLocation, currentLocation])

  return (
    <MapContainer
      center={mapCenter}
      zoom={MAP_CONFIG.defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={mapCenter} zoom={MAP_CONFIG.defaultZoom} />

      {/* دائرة حول الموقع الحالي */}
      {currentLocation && (
        <Circle
          center={currentLocation}
          radius={30}
          pathOptions={{ color: '#0066FF', fillColor: '#0066FF', fillOpacity: 0.15 }}
        />
      )}

      {/* علامة نقطة الانطلاق */}
      {pickupLocation && (
        <Marker position={pickupLocation} icon={pickupIcon}>
          <Popup>📍 نقطة الانطلاق</Popup>
        </Marker>
      )}

      {/* علامة الوجهة */}
      {dropoffLocation && (
        <Marker position={dropoffLocation} icon={dropoffIcon}>
          <Popup>🎯 الوجهة</Popup>
        </Marker>
      )}

      {/* خط المسار (مستقيم) */}
      {routePoints.length === 2 && (
        <Polyline positions={routePoints} color="#0066FF" weight={5} opacity={0.7} dashArray="12, 8" />
      )}

      {/* السائقين القريبين (للواجهة الزبون) */}
      {user?.role === 'customer' && nearbyDrivers.map((driver) => {
        const loc = driver.current_location
        if (!loc) return null
        return (
          <Marker key={driver.id} position={[loc.lat, loc.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold">{driver.vehicle_model}</p>
                <p className="text-sm text-text-secondary">{driver.plate_number}</p>
                <p className="text-yellow-500">⭐ {driver.rating?.toFixed(1) || '5.0'}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* موقع السائق في الرحلة النشطة */}
      {activeRide?.driver?.current_location && (
        <Marker
          position={[activeRide.driver.current_location.lat, activeRide.driver.current_location.lng]}
          icon={driverIcon}
        >
          <Popup>🚗 موقع السائق</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
