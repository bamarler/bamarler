import { Metadata } from 'next'
import { BookingWidget } from '@/components/booking/BookingWidget'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Book a Meeting | Benjamin Marler',
  description:
    'Schedule a meeting with Benjamin Marler. Available for co-op discussions, project consultations, and technical conversations.',
  openGraph: {
    title: 'Book a Meeting | Benjamin Marler',
    description: 'Schedule a meeting with Benjamin Marler',
  },
}

export default function BookPage() {
  return (
    <main className="bg-bg-dark flex h-dvh flex-col overflow-hidden px-4 py-4 md:min-h-screen md:items-center md:justify-center md:overflow-auto md:px-6 md:py-12">
      <div className="flex w-full max-w-4xl flex-1 flex-col md:flex-none">
        {/* Back link */}
        <Link
          href="/"
          className="text-text-muted hover:text-text-primary mb-3 inline-flex flex-shrink-0 items-center gap-2 text-sm transition-colors md:mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portfolio
        </Link>

        {/* Booking Widget (header is now inside the card) */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-none">
          <BookingWidget />
        </div>
      </div>
    </main>
  )
}
