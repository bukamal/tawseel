import { useEffect, useState } from 'react'
import { useAppStore } from './app/store'
import Onboarding from './features/auth/Onboarding'
import RideRequest from './features/ride-request/RideRequest'
import DriverMode from './features/driver-mode/DriverMode'
import ActiveRide from './features/ride-request/ActiveRide'
import NotificationsBell from './components/common/NotificationsBell'
import AdminDashboard from './features/admin/AdminDashboard'

function App() {
  const { user, setUser, setLocation, isOnboarding, activeRide } = useAppStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
    }
    const params = new URLSearchParams(window.location.search)
    const telegramId = tg?.initDataUnsafe?.user?.id ?? params.get('tg_id')
    if (telegramId) {
      fetchUser(telegramId)
    }

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude]
          setLocation(loc)
          updateDriverLocation(pos.coords)
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
      )
    }
  }, [])

  const fetchUser = async (telegramId) => {
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

  const updateDriverLocation = async (coords) => {
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
          <button className="icon-btn" onClick={() => setShowAdmin(true)}>📊</button>
        )}
        <button className="icon-btn" onClick={() => useAppStore.getState().logout()}>🚪</button>
      </div>

      <div className="map-container">
        {/* الخريطة سنضيفها لاحقاً بعد التأكد من عمل الأساسيات */}
        <div style={{ color: 'white', padding: 20 }}>🗺️ الخريطة قيد التحميل...</div>
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
