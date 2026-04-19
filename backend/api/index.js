import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const botToken = process.env.BOT_TOKEN
const frontendUrl = process.env.FRONTEND_URL
const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim())

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env')
if (!botToken) throw new Error('Missing BOT_TOKEN')

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function sendMessage(chatId, text, options = {}) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options })
  })
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function estimateFare(distanceKm, vehicleType = 'economy') {
  const base = { economy:10, comfort:15, business:25, van:30, motorcycle:8 }
  const rate = { economy:2, comfort:3, business:5, van:6, motorcycle:1.5 }
  return Math.round((base[vehicleType]||10) + distanceKm*(rate[vehicleType]||2))
}

function convertToStars(sar) {
  return Math.max(Math.ceil(sar * 0.27 * 77), 10)
}

async function authorizeAdmin(userId) {
  if (!userId) return false
  const { data } = await supabase.from('users').select('telegram_id,role').eq('id', userId).single()
  return data?.role === 'admin' || adminIds.includes(String(data?.telegram_id))
}

export default async function handler(req, res) {
  const { method, url, body, query } = req
  const path = url.split('?')[0]
  const segments = path.split('/').filter(s => s)

  if (method === 'OPTIONS') return res.status(200).end()

  try {
    // Webhook
    if (segments[1] === 'webhook') {
      const payload = body
      if (payload.pre_checkout_query) {
        const q = payload.pre_checkout_query
        await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pre_checkout_query_id: q.id, ok: true })
        })
        return res.status(200).json({ ok: true })
      }
      if (payload.message?.successful_payment) {
        const payment = payload.message.successful_payment
        const chatId = payload.message.chat.id
        const invoice = payment.invoice_payload
        const { data: tx } = await supabase
          .from('stars_transactions')
          .update({ status: 'completed', telegram_response: payment })
          .eq('invoice_payload', invoice)
          .select('ride_id')
          .single()
        if (tx?.ride_id) {
          await supabase.from('rides').update({ stars_payment_status: 'paid', payment_status: 'completed', status: 'searching' }).eq('id', tx.ride_id)
          await sendMessage(chatId, '✅ تم الدفع بنجاح! جاري البحث عن سائق...')
        }
        return res.status(200).json({ ok: true })
      }
      const { message, callback_query } = payload
      if (message?.text === '/start') {
        const chatId = message.chat.id
        const telegramId = message.from.id
        const fullName = message.from.first_name + (message.from.last_name ? ' ' + message.from.last_name : '')
        let { data: user } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single()
        if (!user) {
          const { data: newUser } = await supabase.from('users').insert({ telegram_id: telegramId, chat_id: chatId, full_name: fullName }).select().single()
          user = newUser
        }
        const miniAppUrl = `${frontendUrl}?tg_id=${telegramId}&chat_id=${chatId}`
        await sendMessage(chatId, '🚗 مرحباً بك في Tawseel!', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛍️ أنا زبون', callback_data: 'set_role_customer' }],
              [{ text: '🚙 أنا سائق', callback_data: 'set_role_driver' }],
              [{ text: '🚀 فتح التطبيق', web_app: { url: miniAppUrl } }]
            ]
          }
        })
      } else if (callback_query) {
        const q = callback_query
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: q.id })
        })
        const telegramId = q.from.id
        const chatId = q.message.chat.id
        if (q.data === 'set_role_customer') {
          await supabase.from('users').update({ role: 'customer' }).eq('telegram_id', telegramId)
          await sendMessage(chatId, '✅ تم تعيينك كزبون.')
        } else if (q.data === 'set_role_driver') {
          await supabase.from('users').update({ role: 'driver' }).eq('telegram_id', telegramId)
          await sendMessage(chatId, '✅ تم تعيينك كسائق. افتح التطبيق لإكمال بياناتك.')
        }
      }
      return res.status(200).json({ ok: true })
    }

    // Users
    if (segments[1] === 'users') {
      const telegramId = segments[2]
      if (method === 'GET' && telegramId) {
        const { data: user } = await supabase.from('users').select('*, drivers(*)').eq('telegram_id', telegramId).single()
        return res.status(200).json({ user: { ...user, driver_id: user?.drivers?.[0]?.id } })
      }
      if (method === 'POST' && segments[2] === 'update') {
        let { telegram_id, chat_id, full_name, username, phone, role } = body
        const finalFullName = full_name || 'مستخدم'
        const { data: user, error } = await supabase
          .from('users')
          .upsert({ telegram_id, chat_id, full_name: finalFullName, username, phone, role, updated_at: new Date().toISOString() }, { onConflict: 'telegram_id' })
          .select().single()
        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json({ user })
      }
    }

    // Drivers
    if (segments[1] === 'drivers') {
      const action = segments[2]
      if (method === 'GET' && action === 'nearby') {
        const { lat, lng, radius = '5000' } = query
        const { data } = await supabase.rpc('nearby_drivers', {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius_meters: parseInt(radius)
        })
        return res.status(200).json({ drivers: data || [] })
      }
      if (method === 'POST' && action === 'location') {
        const { driver_id, lat, lng, heading, speed } = body
        await supabase.from('drivers').update({
          current_location: `POINT(${lng} ${lat})`,
          heading, speed,
          location_updated_at: new Date().toISOString()
        }).eq('id', driver_id)
        return res.status(200).json({ success: true })
      }
      if (method === 'POST' && action === 'register') {
        const { user_id, type, model, color, plate, license, license_photo_url, vehicle_photo_url } = body
        const { data: driver } = await supabase.from('drivers').insert({
          user_id, vehicle_type: type, vehicle_model: model, vehicle_color: color,
          plate_number: plate, license_number: license, license_photo_url, vehicle_photo_url,
          is_available: false, is_verified: false
        }).select().single()
        await supabase.from('users').update({ role: 'driver' }).eq('id', user_id)
        return res.status(201).json({ driver })
      }
      if (method === 'PATCH' && action === 'status') {
        const { driver_id, is_online, is_available } = body
        await supabase.from('drivers').update({ is_online, is_available }).eq('id', driver_id)
        return res.status(200).json({ success: true })
      }
    }

    // Rides
    if (segments[1] === 'rides') {
      const action = segments[2]
      if (method === 'POST' && action === 'estimate_price') {
        const { pickup_location, dropoff_location, vehicle_type = 'economy' } = body
        const distance = calculateDistance(pickup_location[0], pickup_location[1], dropoff_location[0], dropoff_location[1])
        const base = estimateFare(distance, vehicle_type)
        const { data: surge } = await supabase.rpc('calculate_surge_multiplier', { pickup_lat: pickup_location[0], pickup_lng: pickup_location[1], vehicle_type })
        const final = Math.round(base * (surge || 1))
        return res.status(200).json({ distance_km: Math.round(distance*100)/100, final_price: final, stars_price: convertToStars(final), surge_multiplier: surge||1 })
      }
      if (method === 'POST' && action === 'request') {
        const { customer_id, pickup_location, dropoff_location, pickup_address, dropoff_address, vehicle_type, estimated_price, payment_method } = body
        const distance = calculateDistance(pickup_location[0], pickup_location[1], dropoff_location[0], dropoff_location[1])
        const price = estimated_price || estimateFare(distance, vehicle_type)
        const { data: ride } = await supabase.from('rides').insert({
          customer_id,
          pickup_location: `POINT(${pickup_location[1]} ${pickup_location[0]})`,
          dropoff_location: `POINT(${dropoff_location[1]} ${dropoff_location[0]})`,
          pickup_address: pickup_address || 'موقع الانطلاق',
          dropoff_address: dropoff_address || 'الوجهة',
          status: payment_method === 'stars' ? 'pending_payment' : 'searching',
          vehicle_type, price,
          stars_price: payment_method === 'stars' ? convertToStars(price) : null,
          distance_km: distance, payment_method
        }).select().single()
        return res.status(201).json({ ride })
      }
      if (method === 'POST' && action === 'accept') {
        const { ride_id, driver_id } = body
        const { data: ride } = await supabase.from('rides').update({ driver_id, status: 'accepted' }).eq('id', ride_id).select('*, driver:drivers(*, user:users(*)), customer:users(*)').single()
        await supabase.from('drivers').update({ is_available: false }).eq('id', driver_id)
        if (ride.customer?.chat_id) await sendMessage(ride.customer.chat_id, `✅ تم قبول رحلتك!\nالسائق: ${ride.driver.user.full_name}`)
        return res.status(200).json({ ride })
      }
      if (method === 'POST' && action === 'cancel') {
        const { ride_id, cancelled_by } = body
        await supabase.from('rides').update({ status: 'cancelled', cancelled_by }).eq('id', ride_id)
        return res.status(200).json({ success: true })
      }
    }

    // Ratings
    if (segments[1] === 'ratings' && segments[2] === 'create' && method === 'POST') {
      const { ride_id, from_user_id, to_user_id, rating, comment } = body
      const { data } = await supabase.from('ratings').insert({ ride_id, from_user_id, to_user_id, rating, comment }).select().single()
      return res.status(201).json({ rating: data })
    }

    // Notifications
    if (segments[1] === 'notifications') {
      if (method === 'GET') {
        const { user_id } = query
        const { data } = await supabase.from('notifications').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(50)
        return res.status(200).json({ notifications: data || [], unread_count: (data||[]).filter(n => !n.is_read).length })
      }
      if (method === 'PATCH') {
        const { notification_id, mark_as_read } = body
        if (notification_id) {
          await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notification_id)
        } else if (mark_as_read === 'all') {
          await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', query.user_id).eq('is_read', false)
        }
        return res.status(200).json({ success: true })
      }
    }

    // Admin
    if (segments[1] === 'admin') {
      const userId = req.headers['x-user-id']
      if (!await authorizeAdmin(userId)) return res.status(403).json({ error: 'Forbidden' })
      const action = segments[2]
      if (method === 'GET' && action === 'drivers' && segments[3] === 'pending') {
        const { data } = await supabase.from('drivers').select('id, user_id, vehicle_type, vehicle_model, vehicle_color, plate_number, license_number, license_photo_url, vehicle_photo_url, created_at, user:users(full_name, phone)').eq('is_verified', false).order('created_at', { ascending: false })
        return res.status(200).json({ drivers: data })
      }
      if (method === 'PATCH' && action === 'drivers' && segments[4] === 'verify') {
        const driverId = segments[3]
        const { is_verified, reason } = body
        const { data: driver } = await supabase.from('drivers').update({ is_verified }).eq('id', driverId).select('user_id, user:users(chat_id, full_name)').single()
        if (driver?.user?.chat_id) {
          await sendMessage(driver.user.chat_id, is_verified ? '✅ تم توثيق حسابك كسائق!' : `❌ تم رفض طلبك. السبب: ${reason || 'غير مكتمل'}`)
        }
        return res.status(200).json({ success: true })
      }
    }

    return res.status(404).json({ error: 'Not found' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: error.message })
  }
}
