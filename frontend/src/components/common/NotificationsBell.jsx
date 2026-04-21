import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/app/store'
import { api } from '@/lib/api'
import { formatDate } from '@/utils/formatters'

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
      const data = await api.notifications.get()
      setNotifications(data.notifications)
      setUnread(data.unread_count)
    } catch (e) { console.error(e) }
  }

  const markAsRead = async (id) => {
    await api.notifications.markAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(p => Math.max(0, p - 1))
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} className="icon-btn" style={{ position: 'relative' }}>
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: 'var(--color-danger)', color: 'white',
            borderRadius: 10, padding: '2px 6px', fontSize: 11
          }}>{unread}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'absolute', top: 40, left: 0, width: 320,
              background: 'var(--color-surface)', borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: 400, overflowY: 'auto', zIndex: 100
            }}
          >
            {notifications.length === 0 ? (
              <p style={{ padding: 20, textAlign: 'center' }}>لا توجد إشعارات</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  style={{
                    padding: 12, borderBottom: '1px solid #eee',
                    background: n.is_read ? 'white' : '#f0f7ff',
                    cursor: 'pointer'
                  }}
                >
                  <p><strong>{n.title}</strong></p>
                  <p style={{ fontSize: 13 }}>{n.body}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-gray)' }}>{formatDate(n.created_at)}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
