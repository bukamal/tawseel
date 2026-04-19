import { useState } from 'react'
import { useAppStore } from '@/app/store'

export default function RideRequest() {
  const { setPickup, setDropoff } = useAppStore()
  const [loading, setLoading] = useState(false)

  const handleRequest = () => {
    setLoading(true)
    // منطق الطلب سيضاف لاحقاً
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>🚗 اطلب توصيلة</h3>
      <button onClick={() => setPickup([33.5138, 36.2765])}>تحديد نقطة الانطلاق</button>
      <button onClick={() => setDropoff([33.5200, 36.2800])}>تحديد الوجهة</button>
      <button onClick={handleRequest} disabled={loading}>
        {loading ? 'جاري الطلب...' : 'اطلب الآن'}
      </button>
    </div>
  )
}
