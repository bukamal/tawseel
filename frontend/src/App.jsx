import { useEffect, useState } from 'react'
import { useAppStore } from './app/store'
import { initTelegram, hapticFeedback } from './lib/telegram'
import { api } from './lib/api'
import Map from './components/map/Map'
import Onboarding from './features/auth/Onboarding'
import RideRequest from './features/ride-request/RideRequest'
import DriverMode from './features/driver-mode/DriverMode'
import ActiveRide from './features/ride-request/ActiveRide'
import NotificationsBell from './components/common/NotificationsBell'
import AdminDashboard from './features/admin/AdminDashboard'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const { user, setUser, setLocation, isOnboarding, activeRide } = useAppStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [appLoading, setAppLoading] = useState(true)
  const [appError, setAppError] = useState(null)

  useEffect(() => {
    const tgData = initTelegram()
    if (tgData?.telegramId) {
      fetchUser(tgData.telegramId).finally(() => setAppLoading(false))
    } else {
      setAppLoading(false)
      setAppError('تعذر الاتصال بتليجرام')
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
    try {
      const data = await api.users.get(telegramId)
      if (data.user) {
        setUser(data.user)
        setIsAdmin(data.user.role === 'admin')
        if (data.user.role === 'admin') setShowAdmin(true)
      }
    } catch (e) {
      setAppError('فشل تحميل بيانات المستخدم')
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

  if (appLoading) {
    return (
      <div className="app flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (appError) {
    return (
      <div className="app flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">حدث خطأ</h3>
          <p className="text-text-secondary">{appError}</p>
        </div>
      </div>
    )
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
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => setShowAdmin(true)} className="icon-btn">📊</button>
          )}
          <button onClick={() => useAppStore.getState().logout()} className="icon-btn">🚪</button>
        </div>
      </div>

      <div className="map-container">
        <Map />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={user?.role}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bottom-sheet"
        >
          {user?.role === 'driver' ? (
            <DriverMode isAdmin={isAdmin} onOpenAdmin={() => setShowAdmin(true)} />
          ) : activeRide ? (
            <ActiveRide />
          ) : (
            <RideRequest />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default App
