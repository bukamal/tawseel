import { useEffect } from 'react'

/**
 * خطاف مخصص لتطبيق ألوان سمة تيليجرام الحية على متغيرات CSS.
 * يضمن عدم وجود تعارض بصري مع وضع المستخدم الليلي/الفاتح في تيليجرام.
 */
export const useTelegramTheme = () => {
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (!tg) return

    const root = document.documentElement

    // استخراج الألوان من تيليجرام (مع قيم افتراضية احتياطية)
    const buttonColor = tg.themeParams?.button_color || '#007AFF'
    const bgColor = tg.themeParams?.bg_color || '#FFFFFF'
    const secondaryBgColor = tg.themeParams?.secondary_bg_color || '#F2F2F7'
    const textColor = tg.themeParams?.text_color || '#1A1A1A'
    const hintColor = tg.themeParams?.hint_color || '#8E8E93'
    const linkColor = tg.themeParams?.link_color || '#007AFF'

    // حقن القيم في متغيرات CSS الخاصة بنظام التصميم
    root.style.setProperty('--color-primary', buttonColor)
    root.style.setProperty('--color-surface', bgColor)
    root.style.setProperty('--color-background', secondaryBgColor)
    root.style.setProperty('--color-dark', textColor)
    root.style.setProperty('--color-gray', hintColor)
    root.style.setProperty('--color-gray-light', secondaryBgColor)
    root.style.setProperty('--color-primary-hover', linkColor)

    // ضبط لون النص في الخلفيات الداكنة تلقائياً
    const isDark = tg.colorScheme === 'dark'
    if (isDark) {
      root.style.setProperty('--color-dark', '#FFFFFF')
      root.style.setProperty('--color-gray-dark', '#EBEBF5')
      root.style.setProperty('--border-subtle', '1px solid rgba(255,255,255,0.1)')
      root.style.setProperty('--glass-bg', 'rgba(28, 28, 30, 0.85)')
    }

    // إعلام تيليجرام بأن التطبيق جاهز
    tg.ready()
    tg.expand()
  }, [])
}
