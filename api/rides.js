import { supabaseAdmin } from './_lib/supabase.js'
import { sendMessage } from './_lib/telegram.js'
import { RideRequestSchema, RideAcceptSchema } from './_lib/validation.js'

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

function convertToStars(priceSYP) {
  const usd = priceSYP / 15000
  return Math.max(Math.ceil(usd * 77), 10)
}

export default async function handler(req, res) {
  const { method, url, body } = req
  const segments = url.split('/').filter(s => s)
  const action = segments[2]

  if (method === 'POST' && action === 'estimate_price') {
    const { pickup_location, dropoff_location, vehicle_type = 'economy' } = body
    const distance = calculateDistance(pickup_location[0], pickup_location[1], dropoff_location[0], dropoff_location[1])
    const base = estimateFare(distance, vehicle_type)
    const { data: surge } = await supabaseAdmin.rpc('calculate_surge_multiplier', { 
      pickup_lat: pickup_location[0], 
      pickup_lng: pickup_location[1], 
      vehicle_type 
    })
    const final = Math.round(base * (surge || 1))
    return res.status(200).json({ 
      distance_km: Math.round(distance*100)/100, 
      final_price: final, 
      stars_price: convertToStars(final), 
      surge_multiplier: surge || 1 
    })
  }

  if (method === 'POST' && action === 'request') {
    try {
      const validated = RideRequestSchema.parse(body)
      const { customer_id, pickup_location, dropoff_location, pickup_address, dropoff_address, vehicle_type, estimated_price, payment_method } = validated
      const distance = calculateDistance(pickup_location[0], pickup_location[1], dropoff_location[0], dropoff_location[1])
      const price = estimated_price || estimateFare(distance, vehicle_type)
      
      const { data: ride } = await supabaseAdmin
        .from('rides')
        .insert({
          customer_id,
          pickup_location: `POINT(${pickup_location[1]} ${pickup_location[0]})`,
          dropoff_location: `POINT(${dropoff_location[1]} ${dropoff_location[0]})`,
          pickup_address,
          dropoff_address,
          status: payment_method === 'stars' ? 'pending_payment' : 'searching',
          vehicle_type,
          price,
          stars_price: payment_method === 'stars' ? convertToStars(price) : null,
          distance_km: distance,
          payment_method
        })
        .select()
        .single()
      return res.status(201).json({ ride })
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }

  if (method === 'POST' && action === 'accept') {
    const validated = RideAcceptSchema.parse(body)
    const { ride_id, driver_id } = validated
    const { data: ride } = await supabaseAdmin
      .from('rides')
      .update({ driver_id, status: 'accepted' })
      .eq('id', ride_id)
      .select('*, driver:drivers(*, user:users(*)), customer:users(*)')
      .single()
    await supabaseAdmin.from('drivers').update({ is_available: false }).eq('id', driver_id)
    if (ride.customer?.chat_id) {
      await sendMessage(ride.customer.chat_id, `✅ تم قبول رحلتك!\nالسائق: ${ride.driver.user.full_name}`)
    }
    return res.status(200).json({ ride })
  }

  if (method === 'POST' && action === 'cancel') {
    const { ride_id, cancelled_by } = body
    await supabaseAdmin.from('rides').update({ status: 'cancelled', cancelled_by }).eq('id', ride_id)
    return res.status(200).json({ success: true })
  }

  return res.status(404).json({ error: 'Not found' })
}
