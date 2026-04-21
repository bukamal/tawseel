import { z } from 'zod'

export const UserUpdateSchema = z.object({
  telegram_id: z.number(),
  chat_id: z.number().optional(),
  full_name: z.string().min(1),
  username: z.string().optional(),
  phone: z.string().regex(/^09[0-9]{8}$/, 'رقم هاتف سوري غير صالح'),
  role: z.enum(['customer', 'driver'])
})

export const DriverRegisterSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['economy', 'comfort', 'business', 'van', 'motorcycle']),
  model: z.string().min(1),
  color: z.string().optional(),
  plate: z.string().min(1),
  license: z.string().min(1),
  license_photo_url: z.string().url().optional(),
  vehicle_photo_url: z.string().url().optional()
})

export const RideRequestSchema = z.object({
  customer_id: z.string().uuid(),
  pickup_location: z.tuple([z.number(), z.number()]),
  dropoff_location: z.tuple([z.number(), z.number()]),
  pickup_address: z.string(),
  dropoff_address: z.string(),
  vehicle_type: z.string(),
  estimated_price: z.number().optional(),
  payment_method: z.enum(['cash', 'stars'])
})

export const RideAcceptSchema = z.object({
  ride_id: z.string().uuid(),
  driver_id: z.string().uuid()
})

export const RatingCreateSchema = z.object({
  ride_id: z.string().uuid(),
  from_user_id: z.string().uuid(),
  to_user_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional()
})
