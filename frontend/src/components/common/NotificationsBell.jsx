import { useState, useEffect } from 'react'
import { useAppStore } from '@/app/store'

export default function NotificationsBell() {
  const { user } = useAppStore()
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    const i = setInterval(fetchNotifications, 30000)
    return () => clearInterval(i)
  }, [user])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications?user_id=${user.id}`)
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread_count || 0)
    } catch (e) {}
  }

  const markAsRead = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/notifications?user_id=${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: id })
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(p => Math.max(0, p - 1))
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', fontSize: 24 }}>
        🔔 {unread > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: '#FF3B30', color: 'white', borderRadius: 10, padding: '2px 6px', fontSize: 11 }}>{unread}</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 40, left: 0, width: 300, background: 'white', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 400, overflowY: 'auto', zIndex: 100 }}>
          {notifications.length === 0 ? <p style={{ padding: 20 }}>لا توجد إشعارات</p> : notifications.map(n => (
            <div key={n.id} onClick={() => markAsRead(n.id)} style={{ padding: 12, borderBottom: '1px solid #eee', background: n.is_read ? 'white' : '#f0f7ff', cursor: 'pointer' }}>
              <p><strong>{n.title}</strong></p>
              <p style={{ fontSize: 13 }}>{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
