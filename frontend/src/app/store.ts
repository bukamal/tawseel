import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Driver, Ride } from '@/types'

interface AppState {
  user: User | null
  isOnboarding: boolean
  isLoading: boolean
  error: string | null
  currentLocation: [number, number] | null
  pickupLocation: [number, number] | null
  dropoffLocation: [number, number] | null
  activeRide: Ride | null
  nearbyDrivers: Driver[]
  selectedVehicle: string

  setUser: (user: User | null) => void
  setLocation: (location: [number, number]) => void
  setPickup: (location: [number, number]) => void
  setDropoff: (location: [number, number]) => void
  setActiveRide: (ride: Ride | null) => void
  setNearbyDrivers: (drivers: Driver[]) => void
  setSelectedVehicle: (type: string) => void
  updateRideStatus: (status: Ride['status']) => void
  resetRide: () => void
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isOnboarding: true,
      isLoading: false,
      error: null,
      currentLocation: null,
      pickupLocation: null,
      dropoffLocation: null,
      activeRide: null,
      nearbyDrivers: [],
      selectedVehicle: 'economy',

      setUser: (user) => set({ 
        user, 
        isOnboarding: user ? (user.role === 'driver' ? !user.driver_id : !user.phone) : true 
      }),

      setLocation: (location) => set({ currentLocation: location }),
      setPickup: (location) => set({ pickupLocation: location }),
      setDropoff: (location) => set({ dropoffLocation: location }),
      setActiveRide: (ride) => set({ activeRide: ride }),
      setNearbyDrivers: (drivers) => set({ nearbyDrivers: drivers }),
      setSelectedVehicle: (type) => set({ selectedVehicle: type }),

      updateRideStatus: (status) => {
        const ride = get().activeRide
        if (ride) set({ activeRide: { ...ride, status } })
      },

      resetRide: () => set({
        activeRide: null,
        pickupLocation: null,
        dropoffLocation: null,
        nearbyDrivers: []
      }),

      logout: () => set({
        user: null,
        isOnboarding: true,
        activeRide: null,
        pickupLocation: null,
        dropoffLocation: null
      })
    }),
    {
      name: 'tawseel-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
)
