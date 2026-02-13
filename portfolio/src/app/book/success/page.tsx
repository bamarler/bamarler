import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Check Your Email | Benjamin Marler',
}

export default function BookingSuccessPage() {
  return (
    <main className="bg-bg-dark flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="bg-primary-mid/20 text-primary-light mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <Mail className="h-8 w-8" />
        </div>

        {/* Content */}
        <h1 className="font-heading mb-4 text-3xl font-bold">
          Check Your Email
        </h1>
        <p className="text-text-muted mb-8 text-lg">
          We&apos;ve sent a verification link to your email address. Please click
          the link to confirm your booking request.
        </p>

        {/* Info box */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4 text-left text-sm">
          <p className="text-text-muted">
            <strong className="text-text-primary">What happens next?</strong>
          </p>
          <ol className="text-text-muted mt-2 list-inside list-decimal space-y-1">
            <li>Verify your email by clicking the link</li>
            <li>I&apos;ll review your request soon</li>
            <li>You&apos;ll receive a calendar invite if approved</li>
          </ol>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <p className="text-text-muted text-sm">
            Didn&apos;t receive the email? Check your spam folder or{' '}
            <Link href="/book" className="text-primary-light hover:underline">
              try again
            </Link>
            .
          </p>

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
