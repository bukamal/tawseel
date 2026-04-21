import { supabaseAdmin } from './_lib/supabase.js'
import { RatingCreateSchema } from './_lib/validation.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { url, body } = req
  const segments = url.split('/').filter(s => s)
  const action = segments[2]

  if (action === 'create') {
    try {
      const validated = RatingCreateSchema.parse(body)
      const { ride_id, from_user_id, to_user_id, rating, comment } = validated
      const { data } = await supabaseAdmin
        .from('ratings')
        .insert({ ride_id, from_user_id, to_user_id, rating, comment })
        .select()
        .single()
      return res.status(201).json({ rating: data })
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'validation_failed', details: error.errors })
      }
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(404).json({ error: 'Not found' })
}
