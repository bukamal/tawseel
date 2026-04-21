import { useEffect, useState } from 'react'
import { useAppStore } from './app/store'
import { initTelegram } from './lib/telegram'
import { api } from './lib/api'
import Map from './components/map/Map'
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
  const [appError, setAppError] = useState(null)

  useEffect(() => {
    const tgData = initTelegram()
    if (tgData?.telegramId) {
      fetchUser(tgData.telegramId).catch(() => setAppError('فشل تحميل بيانات المستخدم'))
    }

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude]
          setLocation(loc)
          updateDriverLocation(pos.coords)
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
      )
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const fetchUser = async (telegramId) => {
    const data = await api.users.get(telegramId)
    if (data.user) {
      setUser(data.user)
      // التحقق من صلاحية المشرف (يتم جلبها من الخادم فقط)
      const isUserAdmin = data.user.role === 'admin'
      setIsAdmin(isUserAdmin)
      if (isUserAdmin) setShowAdmin(true)
    }
  }

  const updateDriverLocation = async (coords) => {
    const currentUser = useAppStore.getState().user
    if (currentUser?.role === 'driver' && currentUser.driver_id) {
      await api.drivers.updateLocation({
        driver_id: currentUser.driver_id,
        lat: coords.latitude,
        lng: coords.longitude,
        heading: coords.heading,
        speed: coords.speed
      })
    }
  }

  if (appError) {
    return <div style={{ color: 'white', padding: 20 }}>خطأ: {appError}</div>
  }

  if (showAdmin && isAdmin) {
    return <AdminDashboard onClose={() => setShowAdmin(false)} />
  }

  if (isOnboarding) {
    return <Onboarding isAdmin={isAdmin} onOpenAdmin={() => setShowAdmin(true)} />
  }

  return (
    <div className="app">
      <div className="top-bar">
        <NotificationsBell />
        <div>
          {isAdmin && <button className="icon-btn" onClick={() => setShowAdmin(true)}>📊</button>}
          <button className="icon-btn" onClick={() => useAppStore.getState().logout()}>🚪</button>
        </div>
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
