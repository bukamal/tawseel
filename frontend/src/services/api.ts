const API_URL = import.meta.env.VITE_API_URL

export const api = {
  users: {
    get: (telegramId: string) => fetch(`${API_URL}/api/users/${telegramId}`).then(r=>r.json()),
    update: (data: any) => fetch(`${API_URL}/api/users/update`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r=>r.json())
  },
  drivers: {
    nearby: (lat: number, lng: number) => fetch(`${API_URL}/api/drivers/nearby?lat=${lat}&lng=${lng}`).then(r=>r.json()),
    register: (data: any) => fetch(`${API_URL}/api/drivers/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r=>r.json()),
    updateLocation: (data: any) => fetch(`${API_URL}/api/drivers/location`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }),
    updateStatus: (data: any) => fetch(`${API_URL}/api/drivers/status`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
  },
  rides: {
    estimate: (data: any) => fetch(`${API_URL}/api/rides/estimate_price`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r=>r.json()),
    request: (data: any) => fetch(`${API_URL}/api/rides/request`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r=>r.json()),
    accept: (data: any) => fetch(`${API_URL}/api/rides/accept`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r=>r.json()),
    cancel: (data: any) => fetch(`${API_URL}/api/rides/cancel`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
  },
  ratings: {
    create: (data: any) => fetch(`${API_URL}/api/ratings/create`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r=>r.json())
  },
  admin: {
    pendingDrivers: (userId: string) => fetch(`${API_URL}/api/admin/drivers/pending`, { headers: { 'X-User-Id': userId } }).then(r=>r.json()),
    verifyDriver: (userId: string, driverId: string, isVerified: boolean) => fetch(`${API_URL}/api/admin/drivers/${driverId}/verify`, { method:'PATCH', headers:{'Content-Type':'application/json','X-User-Id':userId}, body:JSON.stringify({ is_verified: isVerified }) })
  }
}
