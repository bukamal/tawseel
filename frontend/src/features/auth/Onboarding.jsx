import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/app/store'
import Button from '@/components/atoms/Button'
import Input from '@/components/atoms/Input'
import { api } from '@/lib/api'
import { hapticFeedback, showAlert } from '@/lib/telegram'

export default function Onboarding({ isAdmin, onOpenAdmin }) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('customer')
  const [phone, setPhone] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState({ type: 'economy', model: '', color: '', plate: '', license: '' })
  const [licensePhoto, setLicensePhoto] = useState(null)
  const [vehiclePhoto, setVehiclePhoto] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const { setUser, user } = useAppStore()

  const handleRoleSelect = (selected) => {
    hapticFeedback('medium')
    setRole(selected)
    setStep(2)
  }

  const handlePhoneSubmit = async () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 9) return setError('رقم هاتف غير صالح')
    setIsSubmitting(true)
    setError('')
    const tg = window.Telegram?.WebApp
    const telegramId = tg?.initDataUnsafe?.user?.id
    const fullName = [tg?.initDataUnsafe?.user?.first_name, tg?.initDataUnsafe?.user?.last_name].filter(Boolean).join(' ') || 'مستخدم'
    if (!telegramId) return setError('تعذر الحصول على معرف تيليجرام')
    
    try {
      const data = await api.users.update({ telegram_id: telegramId, full_name: fullName, phone: cleanPhone, role })
      setUser(data.user)
      if (role === 'driver' && !data.user.driver_id) {
        setStep(3)
      }
    } catch (err) {
      setError(err.message)
      showAlert(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const uploadFile = async (file) => {
    setUploadProgress(10)
    const { signedUrl, publicUrl } = await api.drivers.getUploadUrl(file.name, file.type)
    setUploadProgress(30)
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(30 + Math.round((e.loaded / e.total) * 60))
      }
    }
    return new Promise((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadProgress(100)
          resolve(publicUrl)
        } else {
          reject(new Error('فشل الرفع'))
        }
      }
      xhr.onerror = () => reject(new Error('فشل الرفع'))
      xhr.send(file)
    })
  }

  const handleDriverRegistration = async () => {
    if (!vehicleInfo.model || !vehicleInfo.plate || !licensePhoto || !vehiclePhoto) {
      return setError('جميع الحقول مطلوبة')
    }
    setIsSubmitting(true)
    setError('')
    setUploadProgress(0)
    try {
      const licenseUrl = await uploadFile(licensePhoto)
      const vehicleUrl = await uploadFile(vehiclePhoto)
      const data = await api.drivers.register({
        user_id: user.id,
        ...vehicleInfo,
        license_photo_url: licenseUrl,
        vehicle_photo_url: vehicleUrl
      })
      setUser({ ...user, driver_id: data.driver.id, role: 'driver' })
    } catch (err) {
      setError(err.message)
      showAlert(err.message)
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="app flex flex-col p-5 max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-2">🚗 Tawseel</h1>
            <p className="text-text-secondary mb-8">اختر طريقة استخدامك للتطبيق</p>
            <div className="space-y-3">
              <Button variant="outline" size="lg" onClick={() => handleRoleSelect('customer')}>🛍️ أنا زبون</Button>
              <Button variant="outline" size="lg" onClick={() => handleRoleSelect('driver')}>🚙 أنا سائق</Button>
              {isAdmin && <Button variant="secondary" onClick={onOpenAdmin}>📊 لوحة التحكم</Button>}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-4">📱 رقم الهاتف</h2>
            <Input
              label="أدخل رقم جوالك للتواصل"
              icon="📞"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
              error={error}
            />
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={() => setStep(1)}>رجوع</Button>
              <Button variant="primary" onClick={handlePhoneSubmit} loading={isSubmitting}>متابعة</Button>
            </div>
          </motion.div>
        )}

        {step === 3 && role === 'driver' && (
          <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 overflow-y-auto pb-4">
            <h2 className="text-2xl font-bold mb-4">🚙 معلومات المركبة</h2>
            <select
              className="input-field"
              value={vehicleInfo.type}
              onChange={e => setVehicleInfo({ ...vehicleInfo, type: e.target.value })}
            >
              <option value="economy">اقتصادي</option>
              <option value="comfort">مريح</option>
              <option value="business">أعمال</option>
              <option value="van">فان</option>
            </select>
            <Input placeholder="موديل السيارة" value={vehicleInfo.model} onChange={e => setVehicleInfo({ ...vehicleInfo, model: e.target.value })} />
            <Input placeholder="اللون" value={vehicleInfo.color} onChange={e => setVehicleInfo({ ...vehicleInfo, color: e.target.value })} />
            <Input placeholder="رقم اللوحة" value={vehicleInfo.plate} onChange={e => setVehicleInfo({ ...vehicleInfo, plate: e.target.value })} />
            <Input placeholder="رقم الرخصة" value={vehicleInfo.license} onChange={e => setVehicleInfo({ ...vehicleInfo, license: e.target.value })} />
            
            <label className="block text-sm font-medium text-text-secondary mb-1">صورة الرخصة</label>
            <input type="file" accept="image/*" onChange={e => setLicensePhoto(e.target.files?.[0])} className="mb-4" />
            {licensePhoto && <p className="text-success text-sm mb-2">✅ {licensePhoto.name}</p>}
            
            <label className="block text-sm font-medium text-text-secondary mb-1">صورة المركبة</label>
            <input type="file" accept="image/*" onChange={e => setVehiclePhoto(e.target.files?.[0])} className="mb-4" />
            {vehiclePhoto && <p className="text-success text-sm mb-2">✅ {vehiclePhoto.name}</p>}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="progress-bar mb-4">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            {error && <p className="text-danger text-sm mb-4">{error}</p>}
            <Button variant="primary" onClick={handleDriverRegistration} loading={isSubmitting}>إكمال التسجيل</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
