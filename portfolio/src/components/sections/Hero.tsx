'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import { MoveRight, Play, Hand, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import AsciiParticleCanvas from '@/components/canvas/AsciiParticleCanvas'

export default function Hero() {
  const container = useRef<HTMLDivElement>(null)

  const { data: profileData } = supabase.storage
    .from('assets')
    .getPublicUrl('profile_picture.jpg')

  const profileUrl = profileData?.publicUrl

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

      tl.from('.hero-image', {
        opacity: 0,
        scale: 0.8,
        duration: 1.5,
      })
        .from(
          '.hero-title-first',
          { opacity: 0, x: -20, duration: 1 },
          '-=0.8',
        )
        .from(
          '.hero-title-last',
          { opacity: 0, x: -20, duration: 1 },
          '-=0.6',
        )
        .from(
          '.hero-tagline',
          { opacity: 0, y: 20, duration: 1 },
          '-=0.4',
        )
        .from(
          '.hero-btns',
          { opacity: 0, y: 20, duration: 1 },
          '-=0.3',
        )
        .from(
          '.scroll-indicator',
          { opacity: 0, duration: 1 },
          '+=0.2',
        )

      gsap.to('.scroll-indicator', {
        y: 10,
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: 'power1.inOut',
      })
    },
    { scope: container },
  )

  return (
    <section
      ref={container}
      className="relative flex h-screen max-h-screen flex-col items-center justify-center overflow-hidden"
    >
      <AsciiParticleCanvas />

      <div className="relative z-10 container mx-auto flex flex-col items-center justify-center gap-4 px-6 md:flex-row md:gap-24">
        {/* Left: Image */}
        <div className="hero-image relative shrink-0">
          <div className="from-primary-mid/40 to-accent-primary/30 absolute -inset-8 rounded-full bg-gradient-to-tr opacity-50 blur-3xl" />
          <div className="bg-bg-surface relative h-40 w-40 overflow-hidden rounded-full border-2 border-white/10 ring-12 ring-white/[0.01] md:h-[400px] md:w-[400px]">
            {profileUrl && (
              <Image
                src={profileUrl}
                alt="Benjamin Marler"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 160px, 400px"
              />
            )}
          </div>
        </div>
        {/* Right: Content */}
        <div className="space-y-3 text-center md:space-y-6 md:text-left">
          <div className="space-y-1 md:space-y-2">
            <h1 className="font-heading text-4xl leading-none font-bold tracking-tighter md:text-9xl">
              <span className="hero-title-first block">Benjamin</span>
              <span className="hero-title-last text-gradient block italic">
                Marler
              </span>
            </h1>
          </div>

          <div className="hero-tagline hidden max-w-xl md:block">
            <p className="text-text-muted font-mono text-2xl leading-relaxed tracking-tight">
              {`// Engineering systems where physics meets agentic intelligence.`}
            </p>
          </div>

          <div className="hero-btns flex flex-wrap justify-center gap-3 pt-2 md:justify-start md:gap-5 md:pt-4">
            <Link
              href="/resume"
              className="bg-primary-mid hover:bg-primary-light group shadow-primary-dark/40 flex items-center gap-3 rounded-full px-6 py-3 text-sm font-bold shadow-2xl transition-all md:px-10 md:py-4 md:text-base"
            >
              Resume{' '}
              <MoveRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/book"
              className="bg-bg-dark/40 flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-xs font-bold backdrop-blur-sm transition-all hover:bg-white/5 md:gap-3 md:px-10 md:py-4 md:text-sm"
            >
              <Calendar size={16} className="text-accent-primary" />
              <span>Book a Meeting</span>
            </Link>

            <a
              href="#game"
              className="bg-bg-dark/40 flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-xs font-bold backdrop-blur-sm transition-all hover:bg-white/5 md:gap-3 md:px-10 md:py-4 md:text-sm"
            >
              <Play size={16} className="text-accent-primary fill-current" />
              <span>Play Slingshot</span>
            </a>
          </div>
        </div>
      </div>

      {/* Pulsating Scroll Indicator */}
      <div className="scroll-indicator absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 opacity-60 md:bottom-10">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase">
          Scroll
        </span>
        <div className="hidden h-10 w-6 justify-center rounded-full border-2 border-white/20 p-1 md:flex">
          <div className="bg-primary-light h-2 w-1 animate-bounce rounded-full" />
        </div>
        <div className="flex md:hidden">
          <Hand size={24} className="text-white/40" />
        </div>
      </div>
    </section>
  )
}
