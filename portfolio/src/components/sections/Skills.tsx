'use client'

import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { supabase } from '@/lib/supabase'
import {
  Code,
  Database,
  Cpu,
  Globe,
  Zap,
  Brain,
  Table,
  Sparkles,
  GitBranch,
  Cloud,
  Container,
  Triangle,
  Terminal,
  Network,
  Workflow,
  Atom,
  LucideIcon,
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const iconMap: Record<string, LucideIcon> = {
  code: Code,
  database: Database,
  cpu: Cpu,
  globe: Globe,
  zap: Zap,
  brain: Brain,
  table: Table,
  sparkles: Sparkles,
  'git-branch': GitBranch,
  cloud: Cloud,
  container: Container,
  triangle: Triangle,
  terminal: Terminal,
  network: Network,
  workflow: Workflow,
  atom: Atom,
}

const categoryColors = [
  {
    bg: 'rgba(65, 0, 86, 0.7)',
    border: 'rgba(65, 0, 86, 0.8)',
    text: '#c4739b',
  },
  {
    bg: 'rgba(142, 69, 133, 0.7)',
    border: 'rgba(142, 69, 133, 0.8)',
    text: '#c4739b',
  },
  {
    bg: 'rgba(170, 90, 140, 0.7)',
    border: 'rgba(170, 90, 140, 0.8)',
    text: '#d4a0b8',
  },
  {
    bg: 'rgba(196, 115, 155, 0.7)',
    border: 'rgba(196, 115, 155, 0.8)',
    text: '#e8c4d4',
  },
]

interface SkillCategory {
  id: string
  name: string
  display_order: number
}

interface Skill {
  id: string
  name: string
  category_id: string
  proficiency: number | null
  icon_name: string | null
  display_order: number
}

interface GroupedSkills {
  category: SkillCategory
  skills: Skill[]
}

export default function Skills() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [groupedSkills, setGroupedSkills] = useState<GroupedSkills[]>([])

  useEffect(() => {
    async function fetchSkills() {
      const [{ data: categories }, { data: skills }] = await Promise.all([
        supabase
          .from('skill_categories')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('skills')
          .select('*')
          .order('display_order', { ascending: true }),
      ])

      if (categories && skills) {
        const grouped = categories.map((cat) => ({
          category: cat,
          skills: skills.filter((s) => s.category_id === cat.id),
        }))
        setGroupedSkills(grouped)
      }
    }
    fetchSkills()
  }, [])

  useGSAP(() => {
    if (!groupedSkills.length) return

    gsap.from('.skill-orbit-container', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
      opacity: 0,
      scale: 0.9,
      duration: 0.8,
      ease: 'power2.out',
    })
  }, [groupedSkills])

  const ORBIT_SIZE = 520 // px — the "design size" of the orbit square
  const guideRadii = [80, 125, 170, 215]
  const orbitRadii = [80, 125, 170, 215]

  return (
    <section
      id="skills"
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden py-16 md:py-24"
    >
      <div className="skill-orbit-container relative z-10 flex w-full flex-col items-center justify-center px-4">
        <div className="mb-4 text-center md:mb-8">
          <h2 className="font-heading text-3xl font-bold tracking-tight italic md:text-4xl">
            Skill <span className="text-accent-primary">Orbit</span>
          </h2>
        </div>

        {/*
          The orbit is designed at ORBIT_SIZE px then scaled to fit.
          The outer div reserves the scaled height; the inner div is the fixed-size orbit.
        */}
        <div className="orbit-scale-wrapper relative flex items-center justify-center">
          <div
            className="orbit-inner origin-center"
            style={{ width: ORBIT_SIZE, height: ORBIT_SIZE }}
          >
            {/* Core */}
            <div
              className="absolute"
              style={{
                top: ORBIT_SIZE / 2,
                left: ORBIT_SIZE / 2,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="bg-accent-primary/10 absolute -inset-12 rounded-full blur-3xl" />
              <div className="bg-accent-primary/20 absolute -inset-8 rounded-full blur-2xl" />
              <div className="bg-accent-primary/30 absolute -inset-4 rounded-full blur-xl" />
              <div className="from-accent-primary relative h-16 w-16 rounded-full bg-gradient-to-br via-amber-500 to-amber-600 shadow-[0_0_80px_rgba(245,158,11,0.6)] md:h-20 md:w-20">
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-tl from-amber-300/30 to-transparent" />
              </div>
              <div
                className="border-accent-primary/40 absolute -inset-8 animate-spin rounded-full border border-dashed"
                style={{ animationDuration: '15s' }}
              />
              <div
                className="border-accent-primary/20 absolute -inset-14 animate-spin rounded-full border border-dotted"
                style={{
                  animationDuration: '25s',
                  animationDirection: 'reverse',
                }}
              />
            </div>

            {/* Orbit guides */}
            {guideRadii.map((radius, index) => (
              <div
                key={`guide-${index}`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5"
                style={{
                  width: radius * 2,
                  height: radius * 2,
                }}
              />
            ))}

            {/* Rotating ring containers */}
            {groupedSkills.slice(0, 4).map((group, categoryIndex) => {
              const color = categoryColors[categoryIndex]
              const orbitRadius = orbitRadii[categoryIndex]

              return (
                <div
                  key={`ring-${categoryIndex}`}
                  className="absolute top-1/2 left-1/2 h-0 w-0"
                  style={{
                    animation: `spin-ring-${categoryIndex} ${40 + categoryIndex * 10}s linear infinite`,
                  }}
                >
                  {group.skills.map((skill, skillIndex) => {
                    const Icon = skill.icon_name
                      ? iconMap[skill.icon_name] || Code
                      : Code
                    const angle = (skillIndex / group.skills.length) * 360

                    return (
                      <div
                        key={skill.id}
                        className="absolute top-0 left-0"
                        style={{
                          transform: `rotate(${angle}deg) translateX(${orbitRadius}px) rotate(-${angle}deg) translate(-50%, -50%)`,
                        }}
                      >
                        <div
                          style={{
                            animation: `counter-spin-${categoryIndex} ${40 + categoryIndex * 10}s linear infinite`,
                          }}
                        >
                          <div
                            className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium whitespace-nowrap shadow-lg transition-all duration-300 hover:scale-110 md:gap-2 md:px-3 md:py-1.5 md:text-xs"
                            style={{
                              backgroundColor: color.bg,
                              borderColor: color.border,
                              color: color.text,
                              boxShadow: `0 0 15px ${color.border}`,
                            }}
                          >
                            <Icon className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              {skill.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend — hidden on mobile */}
        <div className="mt-4 hidden flex-wrap justify-center gap-6 md:flex">
          {groupedSkills.slice(0, 4).map(({ category }, index) => {
            const color = categoryColors[index]
            return (
              <div key={category.id} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full shadow-lg"
                  style={{
                    backgroundColor: color.border,
                    boxShadow: `0 0 10px ${color.border}`,
                  }}
                />
                <span className="text-text-muted font-mono text-xs tracking-wider uppercase">
                  {category.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .orbit-scale-wrapper {
          width: 520px;
          height: 520px;
        }
        /* Scale the fixed-size orbit to fit within viewport on small screens */
        @media (max-width: 560px) {
          .orbit-scale-wrapper {
            width: calc(100vw - 2rem);
            height: calc(100vw - 2rem);
          }
          .orbit-inner {
            transform: scale(calc((100vw - 2rem) / 520));
            transform-origin: center center;
          }
        }
        @keyframes spin-ring-0 {
          from {
            transform: translate(-50%, -50%) rotate(15deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(375deg);
          }
        }
        @keyframes spin-ring-1 {
          from {
            transform: translate(-50%, -50%) rotate(-8deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-368deg);
          }
        }
        @keyframes spin-ring-2 {
          from {
            transform: translate(-50%, -50%) rotate(22deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(382deg);
          }
        }
        @keyframes spin-ring-3 {
          from {
            transform: translate(-50%, -50%) rotate(-12deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(-372deg);
          }
        }
        @keyframes counter-spin-0 {
          from {
            transform: rotate(-15deg);
          }
          to {
            transform: rotate(-375deg);
          }
        }
        @keyframes counter-spin-1 {
          from {
            transform: rotate(8deg);
          }
          to {
            transform: rotate(368deg);
          }
        }
        @keyframes counter-spin-2 {
          from {
            transform: rotate(-22deg);
          }
          to {
            transform: rotate(-382deg);
          }
        }
        @keyframes counter-spin-3 {
          from {
            transform: rotate(12deg);
          }
          to {
            transform: rotate(372deg);
          }
        }
      `}</style>
    </section>
  )
}
