import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
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
