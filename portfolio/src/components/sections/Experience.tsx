'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

gsap.registerPlugin(ScrollTrigger)

interface ExperienceItem {
  id: string
  company: string
  role: string
  period: string
  description: string
  image_name: string
}

export default function Experience() {
  const container = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<ExperienceItem[]>([])

  useEffect(() => {
    async function fetchExp() {
      const { data: expData } = await supabase
        .from('experiences')
        .select('*')
        .order('display_order', { ascending: true })

      if (expData) setData(expData)
    }
    fetchExp()
  }, [])

  useGSAP(() => {
    if (!data.length) return

    // 1. Tracing Beam Animation
    gsap.fromTo(
      lineRef.current,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: container.current,
          start: 'top 70%',
          end: 'bottom 20%',
          scrub: true,
        },
      },
    )

    // 2. Card Reveal Animation (Fading in as you scroll)
    gsap.utils.toArray('.exp-card').forEach((card: any) => {
      gsap.from(card, {
        opacity: 0,
        y: 40,
        duration: 1.2,
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      })
    })
  }, [data])

  return (
    <section
      id="experience"
      ref={container}
      className="relative container mx-auto px-6 py-32"
    >
      <div className="mb-24 ml-12">
        <h2 className="font-heading text-4xl font-bold italic md:text-5xl">
          Professional Path
        </h2>
        <p className="text-text-muted mt-4 font-mono text-sm tracking-widest">{`// THE TRAJECTORY`}</p>
      </div>

      <div className="relative">
        {/* Background Track */}
        <div className="absolute top-0 left-0 h-full w-[2px] origin-top bg-white/5" />

        {/* Growing Tracing Beam */}
        <div
          ref={lineRef}
          className="bg-primary-mid absolute top-0 left-0 h-full w-[2px] origin-top scale-y-0 shadow-[0_0_15px_rgba(142,69,133,0.5)]"
        />

        <div className="space-y-40">
          {data.map((exp) => {
            const { data: imgData } = supabase.storage
              .from('assets')
              .getPublicUrl(exp.image_name)

            return (
              <div
                key={exp.id}
                className="exp-card group relative flex flex-col items-start gap-12 pl-12 md:flex-row"
              >
                {/* Visual Anchor/Dot */}
                <div className="bg-bg-dark border-primary-light group-hover:bg-primary-light absolute top-2 left-[-6px] z-10 h-3.5 w-3.5 rounded-full border-2 transition-colors" />

                <div className="max-w-2xl flex-grow">
                  <span className="text-accent-primary font-mono text-xs font-bold tracking-widest">
                    {exp.period}
                  </span>
                  <h3 className="font-heading group-hover:text-primary-light mt-2 text-3xl font-bold transition-colors duration-300">
                    {exp.company}
                  </h3>
                  <p className="text-primary-light mb-6 font-medium italic opacity-80">
                    {exp.role}
                  </p>
                  <p className="text-text-muted text-lg leading-relaxed">
                    {exp.description}
                  </p>
                </div>

                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl md:w-80">
                  {imgData?.publicUrl && (
                    <Image
                      src={imgData.publicUrl}
                      alt={exp.company}
                      fill
                      className="object-cover opacity-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                  )}
                  <div className="from-bg-dark/60 absolute inset-0 bg-gradient-to-t to-transparent" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
