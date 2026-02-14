import { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Error | Benjamin Marler',
}

const errorMessages: Record<string, { title: string; message: string }> = {
  missing_token: {
    title: 'Missing Token',
    message: 'The link appears to be incomplete. Please try clicking the link from the email again.',
  },
  invalid_token: {
    title: 'Invalid Link',
    message: 'This link is invalid or has already been used. The booking may have already been processed.',
  },
  expired: {
    title: 'Link Expired',
    message: 'This verification link has expired. The guest will need to submit a new booking request.',
  },
  update_failed: {
    title: 'Update Failed',
    message: 'Failed to update the booking status. Please try clicking the link again or update the booking directly in Supabase.',
  },
  unknown: {
    title: 'Unexpected Error',
    message: 'Something went wrong processing this request. Please try again.',
  },
}

export default async function BookingErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const { reason } = await searchParams
  const error = errorMessages[reason || 'unknown'] || errorMessages.unknown

  return (
    <main className="bg-bg-dark flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400">
          <AlertCircle className="h-8 w-8" />
        </div>

        {/* Content */}
        <h1 className="font-heading mb-4 text-3xl font-bold">{error.title}</h1>
        <p className="text-text-muted mb-8 text-lg">{error.message}</p>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/book"
            className="bg-primary-mid hover:bg-primary-light inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
          >
            Try Booking Again
          </Link>

          <Link
            href="/"
            className="text-text-muted hover:text-text-primary inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Link>
        </div>
      </div>
    </main>
  )
}
