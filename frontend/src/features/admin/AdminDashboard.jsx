import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/app/store';
import Button from '@/components/atoms/Button';
import { formatPrice, formatStarsPrice } from '@/utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ImageModal = ({ url, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <img src={url} alt="مستند" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12 }} />
    </motion.div>
  );
};

export default function AdminDashboard({ onClose }) {
  const { user } = useAppStore();
  const [stats, setStats] = useState({ total_rides: 0, completed_rides: 0, total_revenue: 0, total_stars_revenue: 0, active_drivers: 0, avg_rating: 5.0 });
  const [revenue, setRevenue] = useState([]);
  const [pending, setPending] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ from: new Date(Date.now() - 30*86400000).toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => { fetchStats(); }, [dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_dashboard_stats', { from_date: `${dateRange.from}`, to_date: `${dateRange.to}` });
    if (data && data[0]) setStats(data[0]);
    const { data: rev } = await supabase.rpc('get_revenue_report', { from_date: `${dateRange.from}`, to_date: `${dateRange.to}` });
    setRevenue(rev || []);
    setLoading(false);
  };

  const fetchPending = async () => {
    setLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/pending`, { headers: { 'X-User-Id': user.id } });
    const data = await res.json();
    setPending(data.drivers || []);
    setLoading(false);
  };

  const handleVerify = async (id, isVerified) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${id}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': user.id },
      body: JSON.stringify({ is_verified: isVerified })
    });
    fetchPending();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <Button variant="primary" size="sm" onClick={onClose} style={{ width: 'auto', marginBottom: 20 }}>← العودة للتطبيق</Button>
      <h1 style={{ marginBottom: 20 }}>📊 لوحة التحكم</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div><label>من</label><input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} /></div>
        <div><label>إلى</label><input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} /></div>
        <Button size="sm" onClick={fetchStats}>تحديث</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 16, marginBottom: 30 }}>
        <div className="card"><h3>{stats.total_rides}</h3><p>إجمالي الرحلات</p></div>
        <div className="card"><h3>{stats.completed_rides}</h3><p>مكتملة</p></div>
        <div className="card"><h3>{formatPrice(stats.total_revenue)}</h3><p>نقدي</p></div>
        <div className="card"><h3>{formatStarsPrice(stats.total_stars_revenue)}</h3><p>نجوم</p></div>
        <div className="card"><h3>{stats.active_drivers}</h3><p>سائقين نشطين</p></div>
        <div className="card"><h3>{stats.avg_rating?.toFixed(1)}/5</h3><p>متوسط التقييم</p></div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab('overview')} className={activeTab==='overview'?'active':''} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab==='overview'?'2px solid var(--color-primary)':'none' }}>نظرة عامة</button>
        <button onClick={() => setActiveTab('revenue')} className={activeTab==='revenue'?'active':''} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab==='revenue'?'2px solid var(--color-primary)':'none' }}>الإيرادات</button>
        <button onClick={() => { setActiveTab('pending'); fetchPending(); }} className={activeTab==='pending'?'active':''} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab==='pending'?'2px solid var(--color-primary)':'none' }}>طلبات السائقين</button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'revenue' && revenue.length > 0 && (
          <motion.div key="revenue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
          <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h3>طلبات التسجيل كسائق</h3>
            {loading ? <div className="spinner" /> : pending.length === 0 ? <p>لا توجد طلبات معلقة</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th>الاسم</th><th>الهاتف</th><th>المركبة</th><th>المستندات</th><th>إجراء</th></tr></thead>
                <tbody>
                  {pending.map(d => (
                    <tr key={d.id}><td>{d.user?.full_name}</td><td>{d.user?.phone}</td><td>{d.vehicle_model} ({d.plate_number})</td>
                      <td>
                        {d.license_photo_url && <button onClick={() => setSelectedImage(d.license_photo_url)} style={{ marginRight: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>🪪</button>}
                        {d.vehicle_photo_url && <button onClick={() => setSelectedImage(d.vehicle_photo_url)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>🚗</button>}
                      </td>
                      <td><Button size="sm" variant="success" onClick={()=>handleVerify(d.id,true)}>✅</Button> <Button size="sm" variant="danger" onClick={()=>handleVerify(d.id,false)}>❌</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedImage && <ImageModal url={selectedImage} onClose={() => setSelectedImage(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
