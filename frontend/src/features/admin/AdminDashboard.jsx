import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/app/store'
import Button from '@/components/atoms/Button'
import { formatPrice, formatStarsPrice } from '@/utils/formatters'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import Sheet from '@/components/common/Sheet'

const ImageModal = ({ url, onClose }) => (
  <Sheet isOpen={true} onClose={onClose} height="auto">
    <img src={url} alt="مستند" className="w-full h-auto rounded-lg" />
  </Sheet>
)

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
  const [pendingDrivers, setPendingDrivers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [dateRange])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.rpc('get_dashboard_stats', {
        from_date: `${dateRange.from}`,
        to_date: `${dateRange.to}`
      })
      if (data && data[0]) setStats(data[0])

      const { data: rev } = await supabase.rpc('get_revenue_report', {
        from_date: `${dateRange.from}`,
        to_date: `${dateRange.to}`
      })
      setRevenue(rev || [])
    } catch (e) {
      console.error('Failed to fetch stats:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingDrivers = async () => {
    setLoading(true)
    try {
      const data = await api.admin.pendingDrivers()
      setPendingDrivers(data.drivers || [])
    } catch (e) {
      console.error('Failed to fetch pending drivers:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (driverId, isVerified) => {
    try {
      await api.admin.verifyDriver(driverId, isVerified)
      fetchPendingDrivers()
    } catch (e) {
      console.error('Failed to verify driver:', e)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'pending') {
      fetchPendingDrivers()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="app p-5 overflow-y-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onClose} className="!w-auto">
          ←
        </Button>
        <h1 className="text-2xl font-bold">📊 لوحة التحكم</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          className="input-field !mb-0"
        />
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          className="input-field !mb-0"
        />
        <Button size="sm" onClick={fetchStats} className="!w-auto">
          تحديث
        </Button>
      </div>

      {loading && <div className="flex justify-center py-8"><div className="spinner" /></div>}

      {!loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <StatCard label="إجمالي الرحلات" value={stats.total_rides} />
            <StatCard label="مكتملة" value={stats.completed_rides} />
            <StatCard label="نقدي" value={formatPrice(stats.total_revenue)} />
            <StatCard label="نجوم" value={formatStarsPrice(stats.total_stars_revenue)} />
            <StatCard label="سائقين نشطين" value={stats.active_drivers} />
            <StatCard label="متوسط التقييم" value={`${stats.avg_rating?.toFixed(1) || '5.0'}/5`} />
          </div>

          <div className="flex gap-1 border-b border-border mb-4">
            <TabButton active={activeTab === 'overview'} onClick={() => handleTabChange('overview')}>
              نظرة عامة
            </TabButton>
            <TabButton active={activeTab === 'revenue'} onClick={() => handleTabChange('revenue')}>
              الإيرادات
            </TabButton>
            <TabButton active={activeTab === 'pending'} onClick={() => handleTabChange('pending')}>
              طلبات السائقين
            </TabButton>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'revenue' && revenue.length > 0 && (
              <motion.div
                key="revenue"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="font-semibold mb-3">الإيرادات اليومية</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cash_revenue" fill="#0066FF" name="نقدي" />
                    <Bar dataKey="stars_revenue" fill="#F59E0B" name="نجوم" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {activeTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="font-semibold mb-3">طلبات التسجيل كسائق</h3>
                {pendingDrivers.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">لا توجد طلبات معلقة</p>
                ) : (
                  <div className="space-y-3">
                    {pendingDrivers.map((driver) => (
                      <div key={driver.id} className="card">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{driver.user?.full_name}</p>
                            <p className="text-sm text-text-secondary">{driver.user?.phone}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleVerify(driver.id, true)}
                              className="!w-auto"
                            >
                              ✅
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleVerify(driver.id, false)}
                              className="!w-auto"
                            >
                              ❌
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">
                          {driver.vehicle_model} ({driver.plate_number})
                        </p>
                        <div className="flex gap-2 mt-2">
                          {driver.license_photo_url && (
                            <button
                              onClick={() => setSelectedImage(driver.license_photo_url)}
                              className="text-primary text-sm"
                            >
                              🪪 رخصة
                            </button>
                          )}
                          {driver.vehicle_photo_url && (
                            <button
                              onClick={() => setSelectedImage(driver.vehicle_photo_url)}
                              className="text-primary text-sm"
                            >
                              🚗 مركبة
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {selectedImage && (
          <ImageModal url={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition ${
        active
          ? 'text-primary border-b-2 border-primary'
          : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  )
}
