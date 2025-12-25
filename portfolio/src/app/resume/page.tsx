'use client'

import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Download,
  Loader2,
  ExternalLink,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResumePage() {
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getResume() {
      try {
        const { data } = supabase.storage
          .from('assets')
          .getPublicUrl('resume_benjamin_marler.pdf')

        if (data?.publicUrl) {
          setResumeUrl(data.publicUrl)
        }
      } catch (error) {
        console.error('Error fetching resume:', error)
      } finally {
        setLoading(false)
      }
    }
    getResume()
  }, [])

  return (
    <main className="bg-bg-dark flex h-screen w-full flex-col overflow-hidden">
      {/* Navbar for Resume Page */}
      <header className="bg-bg-dark/80 flex w-full items-center justify-between border-b border-white/5 p-4 backdrop-blur-md">
        <Link
          href="/"
          className="text-text-muted hover:text-accent-primary flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Portfolio</span>
        </Link>

        <div className="flex items-center gap-4">
          {resumeUrl && (
            <a
              href={resumeUrl}
              download
              className="bg-primary-mid hover:bg-primary-light shadow-primary-dark/40 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-lg transition-all"
            >
              <Download size={16} />
              <span>Download PDF</span>
            </a>
          )}
        </div>
      </header>

      <div className="relative flex flex-grow items-center justify-center overflow-hidden bg-[#121212] p-2 md:p-10">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-primary-light animate-spin" size={40} />
            <p className="text-text-muted font-mono text-xs tracking-[0.2em]">
              INITIALIZING PDF
            </p>
          </div>
        ) : resumeUrl ? (
          <div className="relative h-full w-full max-w-5xl bg-white shadow-2xl">
            {/* Desktop: Embedding. Mobile: CTA to prevent the "broken iframe" look */}
            <div className="hidden h-full w-full md:block">
              <object
                data={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                className="h-full w-full"
              >
                <p>
                  Your browser does not support PDFs.{' '}
                  <a href={resumeUrl}>Download it instead.</a>
                </p>
              </object>
            </div>

            {/* Mobile / Fallback view */}
            <div className="bg-bg-dark flex h-full flex-col items-center justify-center p-6 text-center md:hidden">
              <div className="bg-primary-mid/20 border-primary-light/20 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border">
                <FileText className="text-primary-light" size={32} />
              </div>
              <h2 className="font-heading mb-2 text-xl font-bold">
                Benjamin Marler Resume
              </h2>
              <p className="text-text-muted mb-6 text-sm">
                Mobile browsers often block embedded PDFs for security. Tap
                below to view the high-quality version.
              </p>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-black transition-all"
              >
                <ExternalLink size={18} />
                <span>Open Full PDF</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="glass-card max-w-md p-10 text-center">
            <p className="text-text-muted mb-4">
              Resume asset missing from Supabase.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
