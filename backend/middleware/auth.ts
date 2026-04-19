import { supabase } from '../lib/supabase'

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim())

export async function authorizeAdmin(userId: string): Promise<boolean> {
  if (!userId) return false
  const { data: user } = await supabase
    .from('users')
    .select('telegram_id, role')
    .eq('id', userId)
    .single()
  
  return user?.role === 'admin' || ADMIN_IDS.includes(String(user?.telegram_id))
}

// التحقق من صحة بيانات Telegram Init Data (سيتم تنفيذه لاحقاً)
export function validateTelegramInitData(initData: string): boolean {
  // سيتم تنفيذ التحقق باستخدام مكتبة @telegram-apps/init-data-node
  return true // مؤقتاً
}
