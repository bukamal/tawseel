export interface User {
  id: string
  telegram_id: number
  chat_id?: number
  full_name: string
  username?: string
  phone?: string
  role: 'customer' | 'driver' | 'admin'
  is_verified: boolean
  created_at: string
  driver_id?: string
}

export interface Driver {
  id: string
  user_id: string
  vehicle_type: 'economy' | 'comfort' | 'business' | 'van' | 'motorcycle'
  vehicle_model: string
  vehicle_color?: string
  plate_number: string
  license_number: string
  license_photo_url?: string
  vehicle_photo_url?: string
  is_available: boolean
  is_online: boolean
  is_verified: boolean
  rating: number
  total_rides: number
  total_earnings: number
  balance_stars: number
  current_location?: { lat: number; lng: number }
}

export interface Ride {
  id: string
  customer_id: string
  driver_id?: string
  pickup_location: { lat: number; lng: number }
  dropoff_location: { lat: number; lng: number }
  pickup_address: string
  dropoff_address: string
  status: 'pending' | 'searching' | 'accepted' | 'arrived' | 'picked_up' | 'completed' | 'cancelled'
  price: number
  stars_price?: number
  distance_km: number
  duration_min: number
  vehicle_type: string
  payment_method: 'cash' | 'stars'
  surge_multiplier: number
  created_at: string
  driver?: Driver
  customer?: User
}

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface LocationAddress {
  coordinates: [number, number]
  address: string
}
