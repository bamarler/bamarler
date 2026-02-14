'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { name: 'About', href: '#about' },
  { name: 'Experience', href: '#experience' },
  { name: 'Projects', href: '#projects' },
  { name: 'Skills', href: '#skills' },
  { name: 'Book', href: '/book' },
  { name: 'Play', href: '#game' },
  { name: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 z-50 w-full border-b transition-all duration-300',
          scrolled
            ? 'bg-bg-dark/80 border-white/10 py-4 backdrop-blur-md'
            : 'border-transparent bg-transparent py-6',
        )}
      >
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link
            href="/"
            className="font-heading text-text-primary text-2xl font-bold tracking-tighter"
          >
            BM<span className="text-accent-primary">.</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) =>
              link.href.startsWith('/') ? (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-text-muted hover:text-accent-primary text-sm font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-text-muted hover:text-accent-primary text-sm font-medium transition-colors"
                >
                  {link.name}
                </a>
              ),
            )}
            <Link
              href="/resume"
              className="border-primary-light/50 hover:bg-primary-light/10 rounded-full border px-5 py-2 text-sm font-bold transition-all"
            >
              Resume
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(true)}
            className="text-text-primary md:hidden"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile full-page menu */}
      <div
        className={cn(
          'fixed inset-0 z-[100] flex flex-col bg-bg-dark transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between px-6 py-6">
          <Link
            href="/"
            onClick={closeMobile}
            className="font-heading text-text-primary text-2xl font-bold tracking-tighter"
          >
            BM<span className="text-accent-primary">.</span>
          </Link>
          <button
            onClick={closeMobile}
            className="text-text-primary"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile links */}
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          {navLinks.map((link) =>
            link.href.startsWith('/') ? (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMobile}
                className="text-text-primary hover:text-accent-primary font-heading text-3xl font-bold transition-colors"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                onClick={closeMobile}
                className="text-text-primary hover:text-accent-primary font-heading text-3xl font-bold transition-colors"
              >
                {link.name}
              </a>
            ),
          )}
          <Link
            href="/resume"
            onClick={closeMobile}
            className="mt-4 border-primary-light/50 hover:bg-primary-light/10 rounded-full border px-8 py-3 text-lg font-bold transition-all"
          >
            Resume
          </Link>
        </div>
      </div>
    </>
  )
}
