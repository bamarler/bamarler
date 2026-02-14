'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Turnstile } from 'react-turnstile'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface TimeSlot {
  start: string
  end: string
  displayTime: string
}

interface BookingFormProps {
  date: Date
  slot: TimeSlot
  timezone: string
  onBack: () => void
}

export function BookingForm({ date, slot, timezone, onBack }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: '',
    notes: '',
    meetingPreference: 'google_meet' as 'google_meet' | 'custom_link' | 'phone',
    customMeetingLink: '',
    phoneNumber: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!turnstileToken && process.env.NODE_ENV === 'production') {
      setError('Please complete the security verification')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: format(date, 'yyyy-MM-dd'),
          startTime: format(new Date(slot.start), 'HH:mm'),
          timezone,
          turnstileToken,
          website: '', // Honeypot - must be empty
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      router.push('/book/success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="font-heading text-2xl font-bold">Your Details</h2>
          <p className="text-text-muted text-sm">
            {format(date, 'EEEE, MMMM d')} at {slot.displayTime}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="Your full name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            minLength={2}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            required
            maxLength={255}
          />
          <p className="text-text-muted text-xs">
            We&apos;ll send a verification email to confirm your booking
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Meeting Topic *</Label>
          <Input
            id="topic"
            placeholder="What would you like to discuss?"
            value={formData.topic}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, topic: e.target.value }))
            }
            required
            minLength={2}
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional context or questions..."
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            maxLength={500}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Meeting Preference</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'google_meet', label: 'Google Meet' },
              { value: 'custom_link', label: 'My Meeting Link' },
              { value: 'phone', label: 'Phone Call' },
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={
                  formData.meetingPreference === option.value
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    meetingPreference: option.value as typeof formData.meetingPreference,
                  }))
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {formData.meetingPreference === 'custom_link' && (
          <div className="space-y-2">
            <Label htmlFor="customMeetingLink">Your Meeting Link *</Label>
            <Input
              id="customMeetingLink"
              type="url"
              placeholder="https://zoom.us/j/..."
              value={formData.customMeetingLink}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customMeetingLink: e.target.value,
                }))
              }
              required={formData.meetingPreference === 'custom_link'}
            />
          </div>
        )}

        {formData.meetingPreference === 'phone' && (
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
              required
              minLength={7}
              maxLength={20}
            />
          </div>
        )}

        {/* Honeypot field - hidden from users, filled by bots */}
        <div className="hidden" aria-hidden="true">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Cloudflare Turnstile — skipped in dev */}
      {process.env.NODE_ENV === 'production' && (
        <div className="flex justify-center">
          <Turnstile
            sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
            onVerify={setTurnstileToken}
            theme="dark"
          />
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Request Booking'
        )}
      </Button>

      <p className="text-text-muted text-center text-xs">
        After submitting, you&apos;ll receive a verification email. Your booking
        will be reviewed and you&apos;ll receive a calendar invite if approved.
      </p>
    </form>
  )
}
