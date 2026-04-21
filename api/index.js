import webhookHandler from './webhook.js'
import usersHandler from './users.js'
import driversHandler from './drivers.js'
import ridesHandler from './rides.js'
import ratingsHandler from './ratings.js'
import notificationsHandler from './notifications.js'
import adminHandler from './admin.js'

export default async function handler(req, res) {
  const { method, url } = req
  
  if (method === 'OPTIONS') {
    return res.status(200).end()
  }

  const path = url.split('?')[0]
  const segments = path.split('/').filter(s => s && s !== 'api')

  try {
    const resource = segments[0]

    switch (resource) {
      case 'webhook':
        return await webhookHandler(req, res)
      case 'users':
        return await usersHandler(req, res)
      case 'drivers':
        return await driversHandler(req, res)
      case 'rides':
        return await ridesHandler(req, res)
      case 'ratings':
        return await ratingsHandler(req, res)
      case 'notifications':
        return await notificationsHandler(req, res)
      case 'admin':
        return await adminHandler(req, res)
      default:
        return res.status(404).json({ error: 'Not found' })
    }
  } catch (error) {
    console.error('Unhandled error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
