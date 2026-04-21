import { supabaseAdmin } from './_lib/supabase.js'
import { getCurrentUser } from './_lib/auth.js'

export default async function handler(req, res) {
  const initData = req.headers.get('x-telegram-init-data')
  const user = await getCurrentUser(initData)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { method, body } = req

  if (method === 'GET') {
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    const unread = data?.filter(n => !n.is_read).length || 0
    return res.status(200).json({ notifications: data || [], unread_count: unread })
  }

  if (method === 'PATCH') {
    const { notification_id, mark_as_read } = body
    if (notification_id) {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notification_id)
        .eq('user_id', user.id)
    } else if (mark_as_read === 'all') {
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false)
    }
    return res.status(200).json({ success: true })
  }

  return res.status(404).json({ error: 'Not found' })
}
