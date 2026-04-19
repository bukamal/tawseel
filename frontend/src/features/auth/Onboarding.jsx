import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../app/store'
import { supabase } from '../../lib/supabase'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('customer')
  const [phone, setPhone] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState({ type: 'economy', model: '', color: '', plate: '', license: '' })
  const [licensePhoto, setLicensePhoto] = useState(null)
  const [vehiclePhoto, setVehiclePhoto] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { setUser, user } = useAppStore()

  const handleRoleSelect = (selected) => { setRole(selected); setStep(2) }

  const handlePhoneSubmit = async () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 9) return setError('رقم هاتف غير صالح')
    setIsSubmitting(true)
    setError('')
    const tg = window.Telegram?.WebApp
    const params = new URLSearchParams(window.location.search)
    const telegramId = tg?.initDataUnsafe?.user?.id ?? params.get('tg_id')
    const chatId = params.get('chat_id')
    const firstName = tg?.initDataUnsafe?.user?.first_name || ''
    const lastName = tg?.initDataUnsafe?.user?.last_name || ''
    const fullName = (firstName + ' ' + lastName).trim() || 'مستخدم'
    if (!telegramId) return setError('تعذر الحصول على معرف تيليجرام')

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, chat_id: chatId, full_name: fullName, phone: cleanPhone, role })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setUser(data.user)
      if (role === 'driver') setStep(3)
    } catch (err) { setError(err.message) }
    finally { setIsSubmitting(false) }
  }

  const uploadPhoto = async (file, bucket, path) => {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const filePath = `${path}/${fileName}`
    const { error } = await supabase.storage.from(bucket).upload(filePath, file)
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return data.publicUrl
  }

  const handleDriverRegistration = async () => {
    if (!vehicleInfo.model || !vehicleInfo.plate || !licensePhoto || !vehiclePhoto) return setError('جميع الحقول مطلوبة')
    setIsSubmitting(true)
    setError('')
    try {
      const licenseUrl = await uploadPhoto(licensePhoto, 'driver-docs', `licenses/${user.id}`)
      const vehicleUrl = await uploadPhoto(vehiclePhoto, 'driver-docs', `vehicles/${user.id}`)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/drivers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...vehicleInfo, license_photo_url: licenseUrl, vehicle_photo_url: vehicleUrl })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setUser({ ...user, driver_id: data.driver.id, role: 'driver' })
    } catch (err) { setError(err.message) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="onboarding-container">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="step">
            <h1>🚗 مرحباً بك في Tawseel</h1>
            <p>اختر كيف تريد استخدام التطبيق</p>
            <div className="role-selection">
              <button onClick={() => handleRoleSelect('customer')}>🛍️ أنا زبون</button>
              <button onClick={() => handleRoleSelect('driver')}>🚙 أنا سائق</button>
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="step">
            <h2>📱 رقم الهاتف</h2>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxx" />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)}>رجوع</button>
              <button onClick={handlePhoneSubmit} disabled={isSubmitting}>{isSubmitting ? 'جاري...' : 'متابعة'}</button>
            </div>
          </motion.div>
        )}
        {step === 3 && role === 'driver' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="step">
            <h2>🚙 معلومات المركبة</h2>
            <select value={vehicleInfo.type} onChange={e => setVehicleInfo({ ...vehicleInfo, type: e.target.value })}>
              <option value="economy">اقتصادي</option><option value="comfort">مريح</option><option value="business">أعمال</option><option value="van">فان</option>
            </select>
            <input placeholder="الموديل" value={vehicleInfo.model} onChange={e => setVehicleInfo({ ...vehicleInfo, model: e.target.value })} />
            <input placeholder="اللون" value={vehicleInfo.color} onChange={e => setVehicleInfo({ ...vehicleInfo, color: e.target.value })} />
            <input placeholder="رقم اللوحة" value={vehicleInfo.plate} onChange={e => setVehicleInfo({ ...vehicleInfo, plate: e.target.value })} />
            <input placeholder="رقم الرخصة" value={vehicleInfo.license} onChange={e => setVehicleInfo({ ...vehicleInfo, license: e.target.value })} />
            <label>صورة الرخصة</label><input type="file" accept="image/*" onChange={e => setLicensePhoto(e.target.files?.[0] || null)} />
            <label>صورة المركبة</label><input type="file" accept="image/*" onChange={e => setVehiclePhoto(e.target.files?.[0] || null)} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button onClick={handleDriverRegistration} disabled={isSubmitting}>{isSubmitting ? 'جاري التسجيل...' : 'إكمال التسجيل'}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
