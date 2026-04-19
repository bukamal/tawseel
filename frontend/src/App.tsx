import { useEffect, useState } from 'react'
import { initTelegram } from '@/lib/telegram'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/app/store'
import Map from '@/components/map/Map'
import Onboarding from '@/features/auth/Onboarding'
import RideRequest from '@/features/ride-request/RideRequest'
import DriverMode from '@/features/driver-mode/DriverMode'
import ActiveRide from '@/features/ride-request/ActiveRide'
import NotificationsBell from '@/components/common/NotificationsBell'
import AdminDashboard from '@/features/admin/AdminDashboard'
import type { User } from '@/types'

function App() {
  const { user, setUser, setLocation, isOnboarding, activeRide } = useAppStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    const tgData = initTelegram()
    if (tgData?.telegramId) {
      fetchUser(tgData.telegramId)
    }

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
          setLocation(loc)
          updateDriverLocation(pos.coords)
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const fetchUser = async (telegramId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${telegramId}`)
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
        const adminIds = (import.meta.env.VITE_ADMIN_TELEGRAM_IDS || '').split(',')
        setIsAdmin(data.user.role === 'admin' || adminIds.includes(String(telegramId)))
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const updateDriverLocation = async (coords: GeolocationCoordinates) => {
    const { user } = useAppStore.getState()
    if (user?.role === 'driver' && user.driver_id) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/drivers/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: user.driver_id,
          lat: coords.latitude,
          lng: coords.longitude,
          heading: coords.heading,
          speed: coords.speed
        })
      })
    }
  }

  if (isOnboarding) return <Onboarding />

  if (showAdmin && isAdmin) {
    return <AdminDashboard onClose={() => setShowAdmin(false)} />
  }

  return (
    <div className="app">
      <div className="top-bar">
        <NotificationsBell />
        {isAdmin && (
          <button className="icon-btn" onClick={() => setShowAdmin(true)} title="لوحة التحكم">
            📊
          </button>
        )}
        <button className="icon-btn" onClick={() => useAppStore.getState().logout()} title="تسجيل الخروج">
          🚪
        </button>
      </div>

      <div className="map-container">
        <Map />
      </div>

      <div className="bottom-sheet">
        {user?.role === 'driver' ? (
          <DriverMode isAdmin={isAdmin} onOpenAdmin={() => setShowAdmin(true)} />
        ) : activeRide ? (
          <ActiveRide />
        ) : (
          <RideRequest />
        )}
      </div>
    </div>
  )
}

export default App
