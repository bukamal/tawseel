import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/app/store'
import Button from '@/components/atoms/Button'
import { formatPrice, formatStarsPrice, formatShortDate } from '@/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard({ onClose }) {
  const { user } = useAppStore()
  const [stats, setStats] = useState({
    total_rides: 0,
    completed_rides: 0,
    total_revenue: 0,
    total_stars_revenue: 0,
    active_drivers: 0,
    avg_rating: 5.0
  })
  const [revenue, setRevenue] = useState([])
  const [pending, setPending] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchStats() }, [dateRange])

  const fetchStats = async () => {
    setLoading(true)
    const { data } = await supabase.rpc('get_dashboard_stats', { from_date: `${dateRange.from}`, to_date: `${dateRange.to}` })
    if (data && data[0]) setStats(data[0])
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15 } }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="admin-dashboard"
    >
      <Button variant="primary" size="sm" onClick={onClose} style={{ width: 'auto', marginBottom: 20 }}>
        ← العودة للتطبيق
      </Button>

      <motion.h1
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        📊 لوحة التحكم
      </motion.h1>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="admin-date-range"
      >
        <div><label>من</label><input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} /></div>
        <div><label>إلى</label><input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} /></div>
        <Button variant="primary" size="sm" onClick={fetchStats}>تحديث</Button>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="admin-stats-grid"
      >
        <motion.div variants={itemVariants} className="admin-stat-card">
          <h3>{stats.total_rides}</h3>
          <p>إجمالي الرحلات</p>
        </motion.div>
        <motion.div variants={itemVariants} className="admin-stat-card">
          <h3>{stats.completed_rides}</h3>
          <p>مكتملة</p>
        </motion.div>
        <motion.div variants={itemVariants} className="admin-stat-card">
          <h3>{formatPrice(stats.total_revenue)}</h3>
          <p>نقدي</p>
        </motion.div>
        <motion.div variants={itemVariants} className="admin-stat-card">
          <h3>{formatStarsPrice(stats.total_stars_revenue)}</h3>
          <p>نجوم</p>
        </motion.div>
        <motion.div variants={itemVariants} className="admin-stat-card">
          <h3>{stats.active_drivers}</h3>
          <p>سائقين نشطين</p>
        </motion.div>
        <motion.div variants={itemVariants} className="admin-stat-card">
          <h3>{stats.avg_rating?.toFixed(1)}/5</h3>
          <p>متوسط التقييم</p>
        </motion.div>
      </motion.div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>نظرة عامة</button>
        <button className={`admin-tab ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}>الإيرادات</button>
        <button className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => { setActiveTab('pending'); fetchPending() }}>طلبات السائقين</button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'revenue' && revenue.length > 0 && (
          <motion.div
            key="revenue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="admin-chart"
          >
            <h3>الإيرادات اليومية</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cash_revenue" fill="#007AFF" />
                <Bar dataKey="stars_revenue" fill="#FFB800" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {activeTab === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="admin-pending"
          >
            <h3>طلبات التسجيل كسائق</h3>
            {loading ? (
              <div className="spinner" />
            ) : pending.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--color-gray)', padding: 40 }}>لا توجد طلبات معلقة</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr><th>الاسم</th><th>الهاتف</th><th>المركبة</th><th>المستندات</th><th>إجراء</th></tr>
                </thead>
                <tbody>
                  {pending.map((d, index) => (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td>{d.user?.full_name}</td>
                      <td>{d.user?.phone}</td>
                      <td>{d.vehicle_model}</td>
                      <td>
                        {d.license_photo_url && <a href={d.license_photo_url} target="_blank" rel="noreferrer">رخصة</a>}
                        {' '}
                        {d.vehicle_photo_url && <a href={d.vehicle_photo_url} target="_blank" rel="noreferrer">مركبة</a>}
                      </td>
                      <td>
                        <Button variant="success" size="sm" onClick={() => handleVerify(d.id, true)} style={{ marginRight: 8 }}>✅ قبول</Button>
                        <Button variant="danger" size="sm" onClick={() => handleVerify(d.id, false)}>❌ رفض</Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
