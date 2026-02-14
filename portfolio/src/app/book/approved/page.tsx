import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Booking Approved | Benjamin Marler',
}

export default function BookingApprovedPage() {
  return (
    <main className="bg-bg-dark flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h1 className="font-heading mb-4 text-3xl font-bold">
          Booking Approved
        </h1>
        <p className="text-text-muted mb-8 text-lg">
          The booking has been approved and a Google Calendar invite has been
          sent to the guest.
        </p>

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
