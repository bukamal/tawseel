const API_URL = import.meta.env.VITE_API_URL

const headers = () => {
  const tg = window.Telegram?.WebApp
  return {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': tg?.initData || ''
  }
}

export const api = {
  users: {
    get: (telegramId) => fetch(`${API_URL}/api/users/${telegramId}`).then(r => r.json()),
    update: (data) => fetch(`${API_URL}/api/users/update`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(r => r.json())
  },
  drivers: {
    nearby: (lat, lng) => fetch(`${API_URL}/api/drivers/nearby?lat=${lat}&lng=${lng}`).then(r => r.json()),
    register: (data) => fetch(`${API_URL}/api/drivers/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
    updateLocation: (data) => fetch(`${API_URL}/api/drivers/location`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }),
    updateStatus: (data) => fetch(`${API_URL}/api/drivers/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(data)
    }),
    getUploadUrl: (fileName, fileType) => fetch(`${API_URL}/api/drivers/upload-url`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ fileName, fileType })
    }).then(r => r.json())
  },
  rides: {
    estimate: (data) => fetch(`${API_URL}/api/rides/estimate_price`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
    request: (data) => fetch(`${API_URL}/api/rides/request`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
    accept: (data) => fetch(`${API_URL}/api/rides/accept`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
    cancel: (data) => fetch(`${API_URL}/api/rides/cancel`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    })
  },
  ratings: {
    create: (data) => fetch(`${API_URL}/api/ratings/create`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    }).then(r => r.json())
  },
  notifications: {
    get: () => fetch(`${API_URL}/api/notifications`, {
      headers: headers()
    }).then(r => r.json()),
    markAsRead: (notificationId) => fetch(`${API_URL}/api/notifications`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ notification_id: notificationId })
    }),
    markAllAsRead: () => fetch(`${API_URL}/api/notifications`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ mark_as_read: 'all' })
    })
  },
  admin: {
    pendingDrivers: () => fetch(`${API_URL}/api/admin/drivers/pending`, {
      headers: headers()
    }).then(r => r.json()),
    verifyDriver: (driverId, isVerified) => fetch(`${API_URL}/api/admin/drivers/${driverId}/verify`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ is_verified: isVerified })
    })
  }
}
