import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/app/store'
import { formatPrice, formatStarsPrice, formatShortDate } from '@/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard({ onClose }) {
  const { user } = useAppStore()
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [pending, setPending] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchStats() }, [dateRange])

  const fetchStats = async () => {
    setLoading(true)
    const { data } = await supabase.rpc('get_dashboard_stats', { from_date: `${dateRange.from}`, to_date: `${dateRange.to}` })
    setStats(data?.[0] || {})
    const { data: rev } = await supabase.rpc('get_revenue_report', { from_date: `${dateRange.from}`, to_date: `${dateRange.to}` })
    setRevenue(rev || [])
    setLoading(false)
  }

  const fetchPending = async () => {
    setLoading(true)
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/pending`, { headers: { 'X-User-Id': user.id } })
    const data = await res.json()
    setPending(data.drivers || [])
    setLoading(false)
  }

  const handleVerify = async (id, isVerified) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
      body: JSON.stringify({ is_verified: isVerified })
    })
    fetchPending()
  }

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto', height: '100vh', overflowY: 'auto', background: '#F5F7FA' }}>
      <button onClick={onClose} style={{ padding: '10px 20px', background: '#007AFF', color: 'white', border: 'none', borderRadius: 30, marginBottom: 20 }}>← العودة للتطبيق</button>
      <h1>📊 لوحة التحكم</h1>
      
      <div style={{ display: 'flex', gap: 16, marginBottom: 30, background: 'white', padding: 16, borderRadius: 16 }}>
        <div><label>من</label><input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} /></div>
        <div><label>إلى</label><input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} /></div>
        <button onClick={fetchStats} style={{ padding: '10px 24px', background: '#007AFF', color: 'white', border: 'none', borderRadius: 12 }}>تحديث</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 30 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 16 }}><h3>{stats.total_rides || 0}</h3><p>إجمالي الرحلات</p></div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16 }}><h3>{stats.completed_rides || 0}</h3><p>مكتملة</p></div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16 }}><h3>{formatPrice(stats.total_revenue || 0)}</h3><p>نقدي</p></div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16 }}><h3>{formatStarsPrice(stats.total_stars_revenue || 0)}</h3><p>نجوم</p></div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16 }}><h3>{stats.active_drivers || 0}</h3><p>سائقين نشطين</p></div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16 }}><h3>{stats.avg_rating?.toFixed(1) || '5.0'}/5</h3><p>متوسط التقييم</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setActiveTab('overview')} style={{ padding: '12px 24px', background: activeTab === 'overview' ? '#007AFF' : '#F0F0F0', color: activeTab === 'overview' ? 'white' : 'black', border: 'none', borderRadius: 20 }}>نظرة عامة</button>
        <button onClick={() => setActiveTab('revenue')} style={{ padding: '12px 24px', background: activeTab === 'revenue' ? '#007AFF' : '#F0F0F0', color: activeTab === 'revenue' ? 'white' : 'black', border: 'none', borderRadius: 20 }}>الإيرادات</button>
        <button onClick={() => { setActiveTab('pending'); fetchPending() }} style={{ padding: '12px 24px', background: activeTab === 'pending' ? '#007AFF' : '#F0F0F0', color: activeTab === 'pending' ? 'white' : 'black', border: 'none', borderRadius: 20 }}>طلبات السائقين</button>
      </div>

      {activeTab === 'revenue' && revenue.length > 0 && (
        <div style={{ background: 'white', padding: 24, borderRadius: 16 }}>
          <h3>الإيرادات اليومية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenue}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="cash_revenue" fill="#007AFF" /><Bar dataKey="stars_revenue" fill="#FFB800" /></BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'pending' && (
        <div style={{ background: 'white', padding: 24, borderRadius: 16 }}>
          <h3>طلبات التسجيل كسائق</h3>
          {loading ? <p>جاري التحميل...</p> : pending.length === 0 ? <p>لا توجد طلبات معلقة</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th>الاسم</th><th>الهاتف</th><th>المركبة</th><th>المستندات</th><th>إجراء</th></tr></thead>
              <tbody>
                {pending.map(d => (
                  <tr key={d.id}><td>{d.user?.full_name}</td><td>{d.user?.phone}</td><td>{d.vehicle_model}</td>
                    <td>{d.license_photo_url && <a href={d.license_photo_url} target="_blank">رخصة</a>} {d.vehicle_photo_url && <a href={d.vehicle_photo_url} target="_blank">مركبة</a>}</td>
                    <td><button onClick={() => handleVerify(d.id, true)} style={{ marginRight: 8, background: '#34C759', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6 }}>✅ قبول</button>
                    <button onClick={() => handleVerify(d.id, false)} style={{ background: '#FF3B30', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6 }}>❌ رفض</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
