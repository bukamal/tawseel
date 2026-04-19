import { useEffect, useState } from 'react'
import { useAppStore } from './app/store'
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

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) { tg.ready(); tg.expand() }
    const params = new URLSearchParams(window.location.search)
    const telegramId = tg?.initDataUnsafe?.user?.id ?? params.get('tg_id')
    
    if (telegramId) fetchUser(telegramId)

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(pos => setLocation([pos.coords.latitude, pos.coords.longitude]), err => console.error(err), { enableHighAccuracy: true })
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
    } catch (error) { console.error(error) }
  }

  if (isOnboarding) {
    return (
      <>
        <Onboarding isAdmin={isAdmin} onOpenAdmin={() => setShowAdmin(true)} />
        {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
      </>
    )
  }

  if (showAdmin && isAdmin) return <AdminDashboard onClose={() => setShowAdmin(false)} />

  return (
    <div className="app">
      <div className="top-bar">
        <NotificationsBell />
        {isAdmin && <button className="icon-btn" onClick={() => setShowAdmin(true)}>📊</button>}
        <button className="icon-btn" onClick={() => useAppStore.getState().logout()}>🚪</button>
      </div>
      <div className="map-container"><Map /></div>
      <div className="bottom-sheet">
        {user?.role === 'driver' ? <DriverMode isAdmin={isAdmin} onOpenAdmin={() => setShowAdmin(true)} /> : activeRide ? <ActiveRide /> : <RideRequest />}
      </div>
    </div>
  )
}

export default App
