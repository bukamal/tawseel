import { useEffect, useState } from 'react';
import { initTelegram } from '@/lib/telegram';
import { useAppStore } from '@/app/store';
import Map from '@/components/map/Map';
import Onboarding from '@/features/auth/Onboarding';
import RideRequest from '@/features/ride-request/RideRequest';
import DriverMode from '@/features/driver-mode/DriverMode';
import ActiveRide from '@/features/ride-request/ActiveRide';
import NotificationsBell from '@/components/common/NotificationsBell';
import AdminDashboard from '@/features/admin/AdminDashboard';

function App() {
  const { user, setUser, setLocation, isOnboarding, activeRide } = useAppStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [appError, setAppError] = useState(null);

  useEffect(() => {
    const tgData = initTelegram();
    if (tgData?.telegramId) {
      fetchUser(tgData.telegramId).catch(() => setAppError('فشل تحميل بيانات المستخدم'));
    }

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setLocation(loc);
          updateDriverLocation(pos.coords);
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchUser = async (telegramId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${telegramId}`);
    if (!res.ok) throw new Error('User not found');
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
      const adminIds = (import.meta.env.VITE_ADMIN_TELEGRAM_IDS || '').split(',');
      const admin = data.user.role === 'admin' || adminIds.includes(String(telegramId));
      setIsAdmin(admin);
      if (admin) {
        setShowAdmin(true);
      }
    }
  };

  const updateDriverLocation = async (coords) => {
    const currentUser = useAppStore.getState().user;
    if (currentUser?.role === 'driver' && currentUser.driver_id) {
      await fetch(`${import.meta.env.VITE_API_URL}/api/drivers/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          driver_id: currentUser.driver_id, 
          lat: coords.latitude, 
          lng: coords.longitude, 
          heading: coords.heading, 
          speed: coords.speed 
        })
      });
    }
  };

  if (appError) {
    return <div style={{ color: 'white', padding: 20 }}>خطأ: {appError}</div>;
  }

  if (showAdmin && isAdmin) {
    return <AdminDashboard onClose={() => setShowAdmin(false)} />;
  }

  if (isOnboarding) return <Onboarding isAdmin={isAdmin} onOpenAdmin={() => setShowAdmin(true)} />;

  return (
    <div className="app">
      <div className="top-bar">
        <NotificationsBell />
        {isAdmin && <button className="icon-btn" onClick={() => setShowAdmin(true)}>📊</button>}
        <button className="icon-btn" onClick={() => useAppStore.getState().logout()}>🚪</button>
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
  );
}

export default App;
