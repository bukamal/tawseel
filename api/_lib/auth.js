import { supabaseAdmin } from './supabase.js'
import { validate } from '@telegram-apps/init-data-node'

const BOT_TOKEN = process.env.BOT_TOKEN
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim())

/**
 * تحقق من صحة initData واستخرج معرف المستخدم الحقيقي
 */
export async function verifyTelegramUser(initData) {
  if (!initData) return null
  try {
    // في البيئة الحقيقية، نتحقق من التوقيع
    validate(initData, BOT_TOKEN)
    const params = new URLSearchParams(initData)
    const user = JSON.parse(params.get('user') || '{}')
    return { id: user.id, ...user }
  } catch (e) {
    console.error('Invalid initData:', e)
    return null
  }
}

/**
 * التحقق من أن المستخدم الحالي هو مشرف
 */
export async function authorizeAdmin(request) {
  const initData = request.headers.get('x-telegram-init-data')
  const user = await verifyTelegramUser(initData)
  if (!user) return false

  const telegramId = user.id
  // تحقق مما إذا كان موجودًا في قائمة المشرفين في المتغيرات
  if (ADMIN_IDS.includes(String(telegramId))) return true

  // تحقق من قاعدة البيانات
  const { data } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('telegram_id', telegramId)
    .single()
  
  return data?.role === 'admin'
}

/**
 * الحصول على المستخدم الحالي (أو إنشاؤه إذا لم يكن موجودًا)
 */
export async function getCurrentUser(initData) {
  const user = await verifyTelegramUser(initData)
  if (!user) return null

  const telegramId = user.id
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'مستخدم'

  let { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (!dbUser) {
    const { data: newUser } = await supabaseAdmin
      .from('users')
      .insert({
        telegram_id: telegramId,
        full_name: fullName,
        username: user.username,
        role: 'customer'
      })
      .select()
      .single()
    dbUser = newUser
  }

  return dbUser
}
