'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

gsap.registerPlugin(ScrollTrigger)

export default function About() {
  const containerRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)

  const { data: photoData } = supabase.storage
    .from('assets')
    .getPublicUrl('about_me_fun.jpg')

  const aboutPhoto = photoData?.publicUrl

  useGSAP(
    () => {
      // Staggered paragraph fade-in
      gsap.utils.toArray<HTMLElement>('.about-text').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          delay: i * 0.15,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        })
      })

      // Photo parallax — scrolls slightly slower
      if (photoRef.current) {
        gsap.to(photoRef.current, {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      }
    },
    { scope: containerRef },
  )

  return (
    <section id="about" ref={containerRef} className="bg-bg-surface/30 py-32">
      <div className="container mx-auto px-6">
        {/* Title - always first */}
        <h2 className="about-text font-heading mb-8 text-center text-4xl font-bold tracking-tight italic lg:mb-0 lg:hidden">
          About <span className="text-accent-primary">Me</span>
        </h2>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left column: Title (desktop) + Text + Chips */}
          <div className="order-2 space-y-8 lg:order-1">
            <h2 className="about-text font-heading hidden text-4xl font-bold tracking-tight italic lg:block">
              About <span className="text-accent-primary">Me</span>
            </h2>

            <div className="text-text-muted space-y-4 text-sm leading-relaxed md:space-y-6 md:text-lg">
              <p className="about-text">
                I&apos;m a junior studying{' '}
                <strong className="text-primary-light">Computer Science</strong>{' '}
                and <strong className="text-primary-light">Physics</strong> with
                a minor in{' '}
                <strong className="text-primary-light">Mathematics</strong> at
                Northeastern University. My passion lies in building intelligent
                systems that can understand and interact with the world around
                them.
              </p>
              <p className="about-text">
                Currently, I&apos;m interested in{' '}
                <strong className="text-accent-primary">
                  Reinforcement Learning
                </strong>{' '}
                and <strong className="text-accent-primary">Physics</strong>{' '}
                simulations for policy transfer learning. My previous work
                focuses on traditional software engineering and data pipelines.
              </p>
              <p className="about-text">
                When I&apos;m away from the keyboard, you&apos;ll find me
                competing on the{' '}
                <strong className="text-primary-light">Ultimate Frisbee</strong>{' '}
                field, traveling to new places, or exploring the outdoors.
              </p>
            </div>

            <div className="about-text text-primary-light flex flex-wrap justify-center gap-4 font-mono text-[10px] tracking-[0.2em] uppercase lg:justify-start">
              <span className="border-primary-light/20 bg-primary-light/5 rounded-full border px-4 py-1.5">
                Ultimate Frisbee
              </span>
              <span className="border-primary-light/20 bg-primary-light/5 rounded-full border px-4 py-1.5">
                Travel
              </span>
              <span className="border-primary-light/20 bg-primary-light/5 rounded-full border px-4 py-1.5">
                Racket Sports
              </span>
            </div>
          </div>

          {/* Photo - first on mobile, second on desktop */}
          <div
            ref={photoRef}
            className="group bg-bg-dark relative order-1 aspect-video overflow-hidden rounded-2xl border border-white/10 shadow-2xl ring-1 ring-white/10 transition-all duration-500 hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] lg:order-2"
          >
            {/* Animated glow effect on hover */}
            <div className="bg-accent-primary pointer-events-none absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30" />

            {aboutPhoto && (
              <Image
                src={aboutPhoto}
                alt="Benjamin Marler - Personal Photo"
                fill
                className="relative z-10 object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
