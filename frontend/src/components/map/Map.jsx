import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/app/store';
import { MAP_CONFIG } from '@/utils/constants';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverIcon = new L.Icon({ iconUrl: '/assets/driver-marker.svg', iconSize: [40, 40], iconAnchor: [20, 40] });
const pickupIcon = new L.Icon({ iconUrl: '/assets/pickup-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] });
const dropoffIcon = new L.Icon({ iconUrl: '/assets/dropoff-marker.svg', iconSize: [35, 45], iconAnchor: [17, 45] });

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

export default function Map() {
  const { currentLocation, pickupLocation, dropoffLocation, nearbyDrivers, activeRide, user } = useAppStore();

  const mapCenter = useMemo(() => {
    if (pickupLocation) return pickupLocation;
    if (currentLocation && currentLocation[0] !== 0) return currentLocation;
    return MAP_CONFIG.defaultCenter;
  }, [pickupLocation, currentLocation]);

  const routePoints = useMemo(() => {
    if (pickupLocation && dropoffLocation) return [pickupLocation, dropoffLocation];
    return [];
  }, [pickupLocation, dropoffLocation]);

  return (
    <MapContainer center={mapCenter} zoom={MAP_CONFIG.defaultZoom} style={{ height: '100%', width: '100%' }} zoomControl={true}>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapController center={mapCenter} zoom={MAP_CONFIG.defaultZoom} />
      
      {currentLocation && (
        <Circle center={currentLocation} radius={30} pathOptions={{ color: '#007AFF', fillColor: '#007AFF', fillOpacity: 0.2 }} />
      )}
      
      {pickupLocation && (
        <Marker position={pickupLocation} icon={pickupIcon}>
          <Popup>نقطة الانطلاق</Popup>
        </Marker>
      )}
      
      {dropoffLocation && (
        <Marker position={dropoffLocation} icon={dropoffIcon}>
          <Popup>الوجهة</Popup>
        </Marker>
      )}
      
      {routePoints.length === 2 && (
        <Polyline positions={routePoints} color="#007AFF" weight={4} dashArray="10, 10" />
      )}
      
      {user?.role === 'customer' && nearbyDrivers.map((driver) => {
        const loc = driver.current_location;
        if (!loc) return null;
        return (
          <Marker key={driver.id} position={[loc.lat, loc.lng]} icon={driverIcon}>
            <Popup>{driver.vehicle_model} ⭐{driver.rating}</Popup>
          </Marker>
        );
      })}
      
      {activeRide?.driver?.current_location && (
        <Marker position={[activeRide.driver.current_location.lat, activeRide.driver.current_location.lng]} icon={driverIcon}>
          <Popup>موقع السائق</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
