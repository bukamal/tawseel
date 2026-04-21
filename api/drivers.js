import { supabaseAdmin } from './_lib/supabase.js'
import { getCurrentUser } from './_lib/auth.js'
import { DriverRegisterSchema } from './_lib/validation.js'

export default async function handler(req, res) {
  const { method, url, body, query } = req
  const segments = url.split('/').filter(s => s)
  const action = segments[2]

  if (method === 'GET' && action === 'nearby') {
    const { lat, lng, radius = '5000' } = query
    const { data } = await supabaseAdmin.rpc('nearby_drivers', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_meters: parseInt(radius)
    })
    return res.status(200).json({ drivers: data || [] })
  }

  if (method === 'POST' && action === 'location') {
    const { driver_id, lat, lng, heading, speed } = body
    await supabaseAdmin
      .from('drivers')
      .update({
        current_location: `POINT(${lng} ${lat})`,
        heading,
        speed,
        location_updated_at: new Date().toISOString()
      })
      .eq('id', driver_id)
    return res.status(200).json({ success: true })
  }

  if (method === 'POST' && action === 'register') {
    try {
      const validated = DriverRegisterSchema.parse(body)
      const { user_id, type, model, color, plate, license, license_photo_url, vehicle_photo_url } = validated

      const { data: user } = await supabaseAdmin.from('users').select('id').eq('id', user_id).single()
      if (!user) return res.status(404).json({ error: 'user_not_found' })

      const { data: existing } = await supabaseAdmin.from('drivers').select('id').eq('user_id', user_id).maybeSingle()
      if (existing) return res.status(409).json({ error: 'driver_already_exists' })

      const { data: driver, error } = await supabaseAdmin
        .from('drivers')
        .insert({
          user_id,
          vehicle_type: type,
          vehicle_model: model,
          vehicle_color: color,
          plate_number: plate,
          license_number: license,
          license_photo_url,
          vehicle_photo_url,
          is_available: false,
          is_verified: false
        })
        .select()
        .single()

      if (error) throw error

      await supabaseAdmin.from('users').update({ role: 'driver' }).eq('id', user_id)
      return res.status(201).json({ driver })
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'validation_failed', details: error.errors })
      }
      return res.status(500).json({ error: error.message })
    }
  }

  if (method === 'PATCH' && action === 'status') {
    const { driver_id, is_online, is_available } = body
    await supabaseAdmin.from('drivers').update({ is_online, is_available }).eq('id', driver_id)
    return res.status(200).json({ success: true })
  }

  if (method === 'POST' && action === 'upload-url') {
    const initData = req.headers.get('x-telegram-init-data')
    const user = await getCurrentUser(initData)
    if (!user) return res.status(401).json({ error: 'Unauthorized' })

    const { fileName, fileType } = body
    const filePath = `${user.id}/${Date.now()}-${fileName}`
    const { data, error } = await supabaseAdmin.storage
      .from('driver-docs')
      .createSignedUploadUrl(filePath, { contentType: fileType })

    if (error) return res.status(500).json({ error: error.message })
    const publicUrl = supabaseAdmin.storage.from('driver-docs').getPublicUrl(filePath).data.publicUrl
    return res.status(200).json({ signedUrl: data.signedUrl, publicUrl })
  }

  return res.status(404).json({ error: 'Not found' })
}
