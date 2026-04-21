import { supabaseAdmin } from './_lib/supabase.js'
import { authorizeAdmin } from './_lib/auth.js'
import { sendMessage } from './_lib/telegram.js'

export default async function handler(req, res) {
  // تحقق من صلاحية المشرف
  const isAdmin = await authorizeAdmin(req)
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const { method, url, body } = req
  const segments = url.split('/').filter(s => s)
  const action = segments[2]

  if (method === 'GET' && action === 'drivers' && segments[3] === 'pending') {
    const { data } = await supabaseAdmin
      .from('drivers')
      .select('id, user_id, vehicle_type, vehicle_model, vehicle_color, plate_number, license_number, license_photo_url, vehicle_photo_url, created_at, user:users(full_name, phone)')
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
    return res.status(200).json({ drivers: data })
  }

  if (method === 'PATCH' && action === 'drivers' && segments[4] === 'verify') {
    const driverId = segments[3]
    const { is_verified, reason } = body
    const { data: driver } = await supabaseAdmin
      .from('drivers')
      .update({ is_verified })
      .eq('id', driverId)
      .select('user_id, user:users(chat_id, full_name)')
      .single()
    if (driver?.user?.chat_id) {
      await sendMessage(
        driver.user.chat_id,
        is_verified ? '✅ تم توثيق حسابك كسائق!' : `❌ تم رفض طلبك. السبب: ${reason || 'غير مكتمل'}`
      )
    }
    return res.status(200).json({ success: true })
  }

  return res.status(404).json({ error: 'Not found' })
}
