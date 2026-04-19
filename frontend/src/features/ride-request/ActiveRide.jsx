import { useAppStore } from '@/app/store'

export default function ActiveRide() {
  const { activeRide } = useAppStore()

  if (!activeRide) return null

  return (
    <div style={{ padding: 20 }}>
      <h3>🚗 رحلة نشطة</h3>
      <p>الحالة: {activeRide.status}</p>
      <p>السعر: {activeRide.price} ل.س</p>
    </div>
  )
}
