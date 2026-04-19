import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../app/store'

export default function Onboarding() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('customer')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useAppStore()

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

    if (!telegramId) {
      setError('تعذر الحصول على معرف تيليجرام')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          chat_id: chatId,
          full_name: tg?.initDataUnsafe?.user?.first_name + ' ' + (tg?.initDataUnsafe?.user?.last_name || ''),
          phone: cleanPhone,
          role
        })
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }

      const data = await res.json()
      setUser(data.user)
      // إذا كان سائقاً ننتقل للخطوة 3 (سيتم إضافتها لاحقاً)
      if (role === 'driver') setStep(3)
    } catch (err) {
      console.error(err)
      setError('فشل الاتصال بالخادم: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
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
            {error && <p className="error">{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)}>رجوع</button>
              <button onClick={handlePhoneSubmit} disabled={isSubmitting}>{isSubmitting ? 'جاري...' : 'متابعة'}</button>
            </div>
          </motion.div>
        )}
        {step === 3 && role === 'driver' && (
          <motion.div className="step">
            <h2>🚙 معلومات المركبة</h2>
            <p>سيتم إضافة حقول المركبة قريباً...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
