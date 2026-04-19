import { useState } from 'react'
import { useAppStore } from '@/app/store'

export default function DriverMode({ isAdmin, onOpenAdmin }) {
  const { user } = useAppStore()
  const [isOnline, setIsOnline] = useState(false)

  if (!user?.driver_id) {
    return <div style={{ padding: 20 }}>حسابك قيد المراجعة</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>🚙 وضع السائق</h3>
      <button onClick={() => setIsOnline(!isOnline)} style={{ background: isOnline ? '#34C759' : '#FF3B30', color: 'white', padding: 10 }}>
        {isOnline ? 'متصل' : 'غير متصل'}
      </button>
      {isAdmin && <button onClick={onOpenAdmin}>لوحة التحكم</button>}
    </div>
  )
}
