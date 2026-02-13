import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Email Verified | Benjamin Marler',
}

export default function BookingVerifiedPage() {
  return (
    <main className="bg-bg-dark flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
          <CheckCircle className="h-8 w-8" />
        </div>

        {/* Content */}
        <h1 className="font-heading mb-4 text-3xl font-bold">
          Email Verified!
        </h1>
        <p className="text-text-muted mb-8 text-lg">
          Your booking request has been submitted for review. I&apos;ll get back
          to you soon.
        </p>

        {/* Info box */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4 text-left text-sm">
          <p className="text-text-muted">
            <strong className="text-text-primary">What happens next?</strong>
          </p>
          <ul className="text-text-muted mt-2 list-inside list-disc space-y-1">
            <li>I&apos;ll review your request</li>
            <li>If approved, you&apos;ll receive a Google Calendar invite</li>
            <li>The invite will include a Google Meet link</li>
          </ul>
        </div>

        {/* Links */}
        <Link
          href="/"
          className="text-text-muted hover:text-text-primary inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </Link>
      </div>
    </main>
  )
}
