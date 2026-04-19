import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/app/store'
import { formatPrice, formatStarsPrice, formatShortDate } from '@/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AdminDashboardProps { onClose: () => void }

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { user } = useAppStore()
  const [stats, setStats] = useState<any>(null)
  const [revenue, setRevenue] = useState([])
  const [pending, setPending] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] })

  useEffect(() => { fetchStats() }, [dateRange])

  const fetchStats = async () => { const { data } = await supabase.rpc('get_dashboard_stats', { from_date: `${dateRange.from}`, to_date: `${dateRange.to}` }); setStats(data?.[0]); const { data: rev } = await supabase.rpc('get_revenue_report', { from_date: `${dateRange.from}`, to_date: `${dateRange.to}` }); setRevenue(rev || []) }
  const fetchPending = async () => { const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/pending`, { headers: { 'X-User-Id': user!.id } }); const data = await res.json(); setPending(data.drivers) }
  const handleVerify = async (id: string, isVerified: boolean) => { await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${id}/verify`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-User-Id': user!.id }, body: JSON.stringify({ is_verified: isVerified }) }); fetchPending() }

  return (
    <div className="admin-dashboard">
      <button className="back-btn" onClick={onClose}>← العودة</button>
      <h1>📊 لوحة التحكم</h1>
      <div className="date-range"><input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} /><input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} /><button onClick={fetchStats}>تحديث</button></div>
      <div className="stats-grid"><div className="stat-card"><h3>{stats?.total_rides || 0}</h3><p>إجمالي الرحلات</p></div><div className="stat-card"><h3>{stats?.completed_rides || 0}</h3><p>مكتملة</p></div><div className="stat-card"><h3>{formatPrice(stats?.total_revenue || 0)}</h3><p>نقدي</p></div><div className="stat-card"><h3>{formatStarsPrice(stats?.total_stars_revenue || 0)}</h3><p>نجوم</p></div></div>
      <div className="tabs"><button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>نظرة عامة</button><button className={activeTab === 'revenue' ? 'active' : ''} onClick={() => setActiveTab('revenue')}>الإيرادات</button><button className={activeTab === 'pending' ? 'active' : ''} onClick={() => { setActiveTab('pending'); fetchPending() }}>طلبات السائقين</button></div>
      {activeTab === 'revenue' && <ResponsiveContainer width="100%" height={300}><BarChart data={revenue}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="cash_revenue" fill="#007AFF" /><Bar dataKey="stars_revenue" fill="#FFB800" /></BarChart></ResponsiveContainer>}
      {activeTab === 'pending' && <table><thead><tr><th>الاسم</th><th>الهاتف</th><th>المركبة</th><th>إجراء</th></tr></thead><tbody>{pending.map((d: any) => <tr key={d.id}><td>{d.user?.full_name}</td><td>{d.user?.phone}</td><td>{d.vehicle_model}</td><td><button onClick={() => handleVerify(d.id, true)}>✅ قبول</button><button onClick={() => handleVerify(d.id, false)}>❌ رفض</button></td></tr>)}</tbody></table>}
    </div>
  )
}
