import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/app/store';
import { supabase } from '@/lib/supabase';
import Button from '@/components/atoms/Button';
import { hapticFeedback, showAlert } from '@/lib/telegram';

export default function Onboarding({ isAdmin, onOpenAdmin }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('customer');
  const [phone, setPhone] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState({ type: 'economy', model: '', color: '', plate: '', license: '' });
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { setUser, user } = useAppStore();

  const handleRoleSelect = (selected) => {
    hapticFeedback('medium');
    setRole(selected);
    setStep(2);
  };

  const handlePhoneSubmit = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 9) return setError('رقم هاتف غير صالح');
    setIsSubmitting(true);
    setError('');
    const tg = window.Telegram?.WebApp;
    const params = new URLSearchParams(window.location.search);
    const telegramId = tg?.initDataUnsafe?.user?.id ?? params.get('tg_id');
    const chatId = params.get('chat_id');
    const fullName = (tg?.initDataUnsafe?.user?.first_name + ' ' + (tg?.initDataUnsafe?.user?.last_name || '')).trim() || 'مستخدم';
    if (!telegramId) return setError('تعذر الحصول على معرف تيليجرام');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, chat_id: chatId, full_name: fullName, phone: cleanPhone, role })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409 || data.error === 'phone_already_exists') {
          throw new Error('رقم الهاتف مسجل مسبقاً. إذا كان هذا رقمك، يرجى التواصل مع الدعم.');
        }
        throw new Error(data.message || 'فشل في حفظ البيانات');
      }
      
      setUser(data.user);
      if (role === 'driver') setStep(3);
    } catch (err) {
      setError(err.message);
      showAlert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadPhoto = async (file, bucket, path) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const filePath = `${path}/${fileName}`;
    const { error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleDriverRegistration = async () => {
    if (!vehicleInfo.model || !vehicleInfo.plate || !licensePhoto || !vehiclePhoto) return setError('جميع الحقول مطلوبة');
    setIsSubmitting(true);
    setError('');
    try {
      const licenseUrl = await uploadPhoto(licensePhoto, 'driver-docs', `licenses/${user.id}`);
      const vehicleUrl = await uploadPhoto(vehiclePhoto, 'driver-docs', `vehicles/${user.id}`);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/drivers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...vehicleInfo, license_photo_url: licenseUrl, vehicle_photo_url: vehicleUrl })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUser({ ...user, driver_id: data.driver.id, role: 'driver' });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-container" style={{ padding: 20, maxWidth: 500, margin: '0 auto' }}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="step">
            <h1 style={{ fontSize: 32, marginBottom: 10 }}>🚗 Tawseel</h1>
            <p style={{ marginBottom: 30 }}>اختر طريقة استخدامك للتطبيق</p>
            <div className="role-selection" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button variant="outline" onClick={() => handleRoleSelect('customer')}>🛍️ أنا زبون</Button>
              <Button variant="outline" onClick={() => handleRoleSelect('driver')}>🚙 أنا سائق</Button>
              {isAdmin && <Button variant="secondary" onClick={onOpenAdmin}>📊 لوحة التحكم</Button>}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="step">
            <h2>📱 رقم الهاتف</h2>
            <p style={{ marginBottom: 20 }}>أدخل رقم جوالك للتواصل</p>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx" style={{ marginBottom: 10 }} />
            {error && <p className="error" style={{ color: 'red', marginBottom: 10 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>رجوع</Button>
              <Button variant="primary" onClick={handlePhoneSubmit} loading={isSubmitting} style={{ flex: 1 }}>متابعة</Button>
            </div>
          </motion.div>
        )}

        {step === 3 && role === 'driver' && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="step">
            <h2>🚙 معلومات المركبة</h2>
            <select value={vehicleInfo.type} onChange={e => setVehicleInfo({ ...vehicleInfo, type: e.target.value })} style={{ marginBottom: 10 }}>
              <option value="economy">اقتصادي</option>
              <option value="comfort">مريح</option>
              <option value="business">أعمال</option>
              <option value="van">فان</option>
            </select>
            <input placeholder="موديل السيارة" value={vehicleInfo.model} onChange={e => setVehicleInfo({ ...vehicleInfo, model: e.target.value })} />
            <input placeholder="اللون" value={vehicleInfo.color} onChange={e => setVehicleInfo({ ...vehicleInfo, color: e.target.value })} />
            <input placeholder="رقم اللوحة" value={vehicleInfo.plate} onChange={e => setVehicleInfo({ ...vehicleInfo, plate: e.target.value })} />
            <input placeholder="رقم الرخصة" value={vehicleInfo.license} onChange={e => setVehicleInfo({ ...vehicleInfo, license: e.target.value })} />
            <label style={{ display: 'block', marginBottom: 5 }}>صورة الرخصة</label>
            <input type="file" accept="image/*" onChange={e => setLicensePhoto(e.target.files?.[0] || null)} style={{ marginBottom: 10 }} />
            <label style={{ display: 'block', marginBottom: 5 }}>صورة المركبة</label>
            <input type="file" accept="image/*" onChange={e => setVehiclePhoto(e.target.files?.[0] || null)} style={{ marginBottom: 10 }} />
            {error && <p className="error" style={{ color: 'red', marginBottom: 10 }}>{error}</p>}
            <Button variant="primary" onClick={handleDriverRegistration} loading={isSubmitting}>إكمال التسجيل</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
