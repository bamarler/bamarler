'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { Mail, Linkedin, Github, MapPin } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const socialLinks = [
  {
    name: 'Email',
    href: 'mailto:marler.b@northeastern.edu',
    icon: Mail,
    label: 'marler.b@northeastern.edu',
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/benjamin-marler',
    icon: Linkedin,
    label: '/in/benjamin-marler',
  },
  {
    name: 'GitHub',
    href: 'https://github.com/bamarler',
    icon: Github,
    label: '@bamarler',
  },
]

export default function Contact() {
  const container = useRef<HTMLElement>(null)

  useGSAP(() => {
    gsap.from('.contact-item', {
      opacity: 0,
      y: 30,
      stagger: 0.1,
      duration: 0.8,
      scrollTrigger: {
        trigger: container.current,
        start: 'top 85%',
        toggleActions: 'play none none reverse',
      },
    })
  }, [])

  return (
    <footer
      ref={container}
      id="contact"
      className="border-t border-white/10 bg-bg-dark"
    >
      <div className="container mx-auto px-6 py-12">
        <div className="mb-6 text-center">
          <h2 className="contact-item font-heading text-3xl font-bold md:text-4xl">
            Let&apos;s Connect
          </h2>
        </div>

        <div className="contact-item mx-auto mb-8 flex items-center justify-center gap-2 text-text-muted">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">Boston, MA</span>
          <span className="mx-2 text-white/20">•</span>
          <span className="text-accent-primary text-sm font-medium">
            Seeking May-Dec 2026 Co-op
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              className="contact-item group flex items-center gap-3 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all group-hover:border-accent-primary group-hover:bg-accent-primary/10">
                <link.icon className="h-5 w-5 text-text-muted transition-colors group-hover:text-accent-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  {link.name}
                </p>
                <p className="text-sm text-text-primary group-hover:text-accent-primary transition-colors">
                  {link.label}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 text-center">
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} Benjamin Marler. Built with Next.js, GSAP & Supabase.
          </p>
        </div>
      </div>
    </footer>
  )
}
