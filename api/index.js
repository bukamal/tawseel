import webhookHandler from './webhook.js'
import usersHandler from './users.js'
import driversHandler from './drivers.js'
import ridesHandler from './rides.js'
import ratingsHandler from './ratings.js'
import notificationsHandler from './notifications.js'
import adminHandler from './admin.js'

export default async function handler(req, res) {
  const { method, url } = req
  const path = url.split('?')[0]
  const segments = path.split('/').filter(s => s)

  // معالجة OPTIONS للـ CORS
  if (method === 'OPTIONS') return res.status(200).end()

  try {
    if (segments[1] === 'webhook') return webhookHandler(req, res)
    if (segments[1] === 'users') return usersHandler(req, res)
    if (segments[1] === 'drivers') return driversHandler(req, res)
    if (segments[1] === 'rides') return ridesHandler(req, res)
    if (segments[1] === 'ratings') return ratingsHandler(req, res)
    if (segments[1] === 'notifications') return notificationsHandler(req, res)
    if (segments[1] === 'admin') return adminHandler(req, res)

    return res.status(404).json({ error: 'Not found' })
  } catch (error) {
    console.error('Unhandled error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
