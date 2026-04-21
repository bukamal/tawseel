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
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.get()
      setNotifications(data.notifications || [])
      setUnread(data.unread_count || 0)
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnread(p => Math.max(0, p - 1))
    } catch (e) {
      console.error('Failed to mark as read:', e)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnread(0)
    } catch (e) {
      console.error('Failed to mark all as read:', e)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="icon-btn relative"
        aria-label="الإشعارات"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute top-14 right-0 w-80 max-h-[400px] overflow-hidden bg-surface rounded-xl shadow-xl border border-border z-50"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">الإشعارات</h3>
                {unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary font-medium"
                  >
                    تعليم الكل كمقروء
                  </button>
                )}
              </div>
              <div className="overflow-y-auto max-h-[350px]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-text-tertiary">
                    <span className="text-3xl mb-2 block">🔕</span>
                    <p>لا توجد إشعارات</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-background ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{notification.title}</p>
                          <p className="text-sm text-text-secondary mt-0.5">{notification.body}</p>
                          <p className="text-xs text-text-tertiary mt-2">{formatDate(notification.created_at)}</p>
                        </div>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
