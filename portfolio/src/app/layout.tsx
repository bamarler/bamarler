import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import SmoothScroll from '@/components/layout/SmoothScroll'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Benjamin Marler | Software Engineer | CS & Physics @ Northeastern',
  description:
    'Building systems where physics meets code. Software Engineer and CS/Physics student seeking May-December 2026 co-op opportunities.',
  metadataBase: new URL('https://bamarler.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Benjamin Marler | Software Engineer',
    description:
      'CS & Physics @ Northeastern. Building at the intersection of physics and code.',
    url: 'https://bamarler.com',
    siteName: 'Benjamin Marler Portfolio',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/api/og',
        alt: 'Benjamin Marler - Software Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Benjamin Marler | Software Engineer',
    description:
      'CS & Physics @ Northeastern. Building at the intersection of physics and code.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Benjamin Marler',
  jobTitle: 'Software Engineering Co-op',
  description:
    'Software Engineer and CS/Physics student at Northeastern University seeking May-December 2026 co-op opportunities.',
  url: 'https://bamarler.com',
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Northeastern University',
  },
  knowsAbout: [
    'Software Engineering',
    'Python',
    'TypeScript',
    'React',
    'Physics',
    'Machine Learning',
  ],
  sameAs: [
    'https://linkedin.com/in/benjamin-marler',
    'https://github.com/bamarler',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen font-sans antialiased',
          inter.variable,
          spaceGrotesk.variable,
          jetbrainsMono.variable,
        )}
      >
        <SmoothScroll>
          <div className="relative flex min-h-screen flex-col">{children}</div>
        </SmoothScroll>
      </body>
    </html>
  )
}
