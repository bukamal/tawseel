import { supabaseAdmin } from './supabase.js'
import { validate, parse } from '@telegram-apps/init-data-node'

const BOT_TOKEN = process.env.BOT_TOKEN
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim())

export async function verifyTelegramUser(initData) {
  if (!initData) return null
  try {
    validate(initData, BOT_TOKEN, { expiresIn: 3600 })
    const parsed = parse(initData)
    return parsed.user || null
  } catch (e) {
    console.error('Invalid initData:', e.message)
    return null
  }
}

export async function authorizeAdmin(request) {
  const initData = request.headers.get('x-telegram-init-data')
  const user = await verifyTelegramUser(initData)
  if (!user) return false

  const telegramId = user.id
  if (ADMIN_IDS.includes(String(telegramId))) return true

  const { data } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('telegram_id', telegramId)
    .single()
  
  return data?.role === 'admin'
}

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
