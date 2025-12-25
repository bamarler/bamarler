'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const navLinks = [
  { name: 'About', href: '#about' },
  { name: 'Experience', href: '#experience' },
  { name: 'Projects', href: '#projects' },
  { name: 'Play', href: '#game' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
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

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-text-muted hover:text-accent-primary text-sm font-medium transition-colors"
            >
              {link.name}
            </a>
          ))}
          <Link
            href="/resume"
            className="border-primary-light/50 hover:bg-primary-light/10 rounded-full border px-5 py-2 text-sm font-bold transition-all"
          >
            Resume
          </Link>
        </div>
      </div>
    </nav>
  )
}
