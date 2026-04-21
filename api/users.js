import { supabaseAdmin } from './_lib/supabase.js'
import { UserUpdateSchema } from './_lib/validation.js'

export default async function handler(req, res) {
  const { method, url, body } = req
  const segments = url.split('/').filter(s => s)
  const telegramId = segments[2]

  if (method === 'GET' && telegramId) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*, drivers(*)')
      .eq('telegram_id', telegramId)
      .single()
    return res.status(200).json({ user: { ...user, driver_id: user?.drivers?.[0]?.id } })
  }

  if (method === 'POST' && segments[2] === 'update') {
    try {
      const validated = UserUpdateSchema.parse(body)
      const { telegram_id, chat_id, full_name, username, phone, role } = validated

      if (phone) {
        const { data: existing } = await supabaseAdmin
          .from('users')
          .select('telegram_id')
          .eq('phone', phone)
          .maybeSingle()
        if (existing && String(existing.telegram_id) !== String(telegram_id)) {
          return res.status(409).json({ error: 'phone_already_exists' })
        }
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .upsert(
          { telegram_id, chat_id, full_name, username, phone, role, updated_at: new Date().toISOString() },
          { onConflict: 'telegram_id' }
        )
        .select()
        .single()

      if (error) throw error

      const { data: fullUser } = await supabaseAdmin
        .from('users')
        .select('*, drivers(*)')
        .eq('id', user.id)
        .single()

      return res.status(200).json({ user: { ...fullUser, driver_id: fullUser?.drivers?.[0]?.id } })
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'validation_failed', details: error.errors })
      }
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(404).json({ error: 'Not found' })
}
