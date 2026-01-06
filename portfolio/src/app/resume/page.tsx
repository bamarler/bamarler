'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
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
