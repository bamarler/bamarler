import { z } from 'zod'

/**
 * Booking request validation schema.
 * Used by the /api/book endpoint.
 */
export const bookingSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255)
    .toLowerCase(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  timezone: z.string().min(1).max(100),
  topic: z
    .string()
    .min(2, 'Please describe the meeting topic')
    .max(200, 'Topic must be less than 200 characters')
    .trim(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  // Honeypot field - must be empty (bots auto-fill this)
  website: z.string().max(0, 'Invalid submission').optional(),
  // Turnstile CAPTCHA token
  turnstileToken: z.string().min(1, 'Please complete the security check'),
  meetingPreference: z
    .enum(['google_meet', 'custom_link', 'phone'])
    .default('google_meet'),
  customMeetingLink: z.string().url('Please enter a valid URL').optional(),
})

export type BookingInput = z.infer<typeof bookingSchema>

/**
 * Validation for email verification endpoint
 */
export const verifyTokenSchema = z.object({
  token: z.string().uuid('Invalid verification token'),
})

/**
 * Validation for approval/rejection endpoint
 */
export const approvalTokenSchema = z.object({
  token: z.string().uuid('Invalid approval token'),
})

/**
 * Availability settings update schema (admin only)
 */
export const availabilityUpdateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean(),
  slotDurationMinutes: z.number().int().min(15).max(120).optional(),
})
