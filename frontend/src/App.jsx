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
  const [debug, setDebug] = useState('')

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) { tg.ready(); tg.expand() }
    const params = new URLSearchParams(window.location.search)
    const telegramId = tg?.initDataUnsafe?.user?.id ?? params.get('tg_id')
    
    // عرض معلومات التشخيص
    const adminIdsEnv = import.meta.env.VITE_ADMIN_TELEGRAM_IDS
    setDebug(`telegramId: ${telegramId}, adminIds: ${adminIdsEnv || 'غير معرف'}`)
    
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
        <Onboarding />
        {isAdmin && (
          <button onClick={() => setShowAdmin(true)} style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 2000, padding: 12, background: '#5856D6', color: 'white', border: 'none', borderRadius: 30 }}>📊 لوحة التحكم</button>
        )}
        {debug && <div style={{ position: 'fixed', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: 8, borderRadius: 8, zIndex: 9999 }}>{debug}</div>}
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
      {debug && <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: 8, borderRadius: 8, zIndex: 9999 }}>{debug}</div>}
    </div>
  )
}

export default App
