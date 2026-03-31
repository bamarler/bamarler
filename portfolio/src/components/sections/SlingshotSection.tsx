'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { Play, Wrench } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function SlingshotSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.from('.slingshot-content', {
        opacity: 0,
        scale: 0.95,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse',
        },
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      ref={containerRef}
      className="relative h-full w-full bg-transparent px-6 py-24"
    >
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-mid/20 blur-[150px]" />

      <div className="slingshot-content relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold tracking-widest text-amber-500 uppercase">
          <Wrench size={14} /> Leaderboard & Improvements Under Development
        </div>

        <h2 className="mb-6 text-4xl font-black tracking-tighter text-white uppercase italic sm:text-6xl md:text-8xl">
          Orbital <br />
          <span className="text-primary-light">Slingshot</span>
        </h2>

        <a
          href="/slingshot"
          className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 font-black text-black shadow-xl shadow-white/10 transition-all hover:scale-105 active:scale-95"
        >
          START SIMULATION <Play size={20} fill="black" />
        </a>
      </div>
    </section>
  )
}
