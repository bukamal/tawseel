export const VEHICLE_TYPES = [
  { id: 'economy', name: 'اقتصادي', icon: '🚗', baseFare: 10, perKm: 2 },
  { id: 'comfort', name: 'مريح', icon: '🚙', baseFare: 15, perKm: 3 },
  { id: 'business', name: 'أعمال', icon: '🚘', baseFare: 25, perKm: 5 },
  { id: 'van', name: 'فان', icon: '🚐', baseFare: 30, perKm: 6 },
  { id: 'motorcycle', name: 'دباب', icon: '🏍️', baseFare: 8, perKm: 1.5 }
];

export const MAP_CONFIG = {
  defaultCenter: [33.5138, 36.2765],
  defaultZoom: 13,
  maxZoom: 18,
  minZoom: 8
};

export const RIDE_STATUS = {
  PENDING: 'pending',
  SEARCHING: 'searching',
  ACCEPTED: 'accepted',
  ARRIVED: 'arrived',
  PICKED_UP: 'picked_up',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};
