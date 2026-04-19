import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      user: null,
      isOnboarding: true,
      currentLocation: null,
      activeRide: null,

      setUser: (user) => set({ user, isOnboarding: !user?.phone }),
      setLocation: (location) => set({ currentLocation: location }),
      setActiveRide: (ride) => set({ activeRide: ride }),
      logout: () => set({ user: null, isOnboarding: true, activeRide: null })
    }),
    { name: 'tawseel-storage' }
  )
)
