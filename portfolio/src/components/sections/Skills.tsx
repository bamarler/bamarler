'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine, ISourceOptions } from '@tsparticles/engine'
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
    bg: 'rgba(65, 0, 86, 0.4)',
    border: 'rgba(65, 0, 86, 0.8)',
    text: '#c4739b',
  },
  {
    bg: 'rgba(142, 69, 133, 0.4)',
    border: 'rgba(142, 69, 133, 0.8)',
    text: '#c4739b',
  },
  {
    bg: 'rgba(170, 90, 140, 0.4)',
    border: 'rgba(170, 90, 140, 0.8)',
    text: '#d4a0b8',
  },
  {
    bg: 'rgba(196, 115, 155, 0.4)',
    border: 'rgba(196, 115, 155, 0.8)',
    text: '#e8c4d4',
  },
]

const ringOffsets = [15, -8, 22, -12]

const particleOptions: ISourceOptions = {
  fullScreen: { enable: false },
  fpsLimit: 60,
  particles: {
    number: { value: 200, density: { enable: true } },
    color: { value: ['#f59e0b', '#fbbf24', '#c4739b', '#8e4585', '#ffffff'] },
    shape: { type: 'circle' },
    opacity: { value: { min: 0.6, max: 1 } },
    size: { value: { min: 2, max: 4 } },
    move: {
      enable: true,
      speed: 1.5,
      direction: 'none',
      random: true,
      outModes: { default: 'out' },
    },
  },
  interactivity: {
    events: { onHover: { enable: true, mode: 'grab' } },
    modes: {
      grab: { distance: 150, links: { opacity: 0.6, color: '#f59e0b' } },
    },
  },
}

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

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

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

    const totalChips = groupedSkills
      .slice(0, 4)
      .reduce((sum, group) => sum + group.skills.length, 0)

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: `+=${totalChips * 80 + 800}`,
        pin: true,
        pinSpacing: true,
        scrub: 0.5,
        anticipatePin: 1,
      },
    })

    // Core appears
    tl.fromTo(
      '.galaxy-core',
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.1 },
      0,
    )

    // Individual chips spiral out one by one
    groupedSkills.slice(0, 4).forEach((group, categoryIndex) => {
      group.skills.forEach((skill, skillIndex) => {
        const delay = categoryIndex * 0.15 + skillIndex * 0.04

        tl.fromTo(
          `.chip-${skill.id}`,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.15, ease: 'back.out(2)' },
          delay,
        )
      })
    })

    tl.to({}, { duration: 0.5 })
  }, [groupedSkills])

  return (
    <section
      id="skills"
      ref={containerRef}
      className="bg-bg-dark relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <Particles
          id="skill-particles"
          // init={particlesInit}
          options={particleOptions}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 container mx-auto flex flex-col items-center justify-center px-6">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-4xl font-bold tracking-tight italic">
            Skill <span className="text-accent-primary">Orbit</span>
          </h2>
        </div>

        <div className="relative aspect-square w-full max-w-2xl">
          {/* Core */}
          <div className="galaxy-core absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-accent-primary/10 absolute -inset-12 rounded-full blur-3xl" />
            <div className="bg-accent-primary/20 absolute -inset-8 rounded-full blur-2xl" />
            <div className="bg-accent-primary/30 absolute -inset-4 rounded-full blur-xl" />
            <div className="from-accent-primary relative h-20 w-20 rounded-full bg-gradient-to-br via-amber-500 to-amber-600 shadow-[0_0_80px_rgba(245,158,11,0.6)]">
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
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`guide-${index}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5"
              style={{
                width: `${200 + index * 120}px`,
                height: `${200 + index * 120}px`,
              }}
            />
          ))}

          {/* Rotating ring containers */}
          {groupedSkills.slice(0, 4).map((group, categoryIndex) => {
            const color = categoryColors[categoryIndex]
            const orbitRadius = 100 + categoryIndex * 60

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
                      className={`chip-${skill.id} absolute top-0 left-0 opacity-0`}
                      style={{
                        transform: `rotate(${angle}deg) translateX(${orbitRadius}px) rotate(-${angle}deg)`,
                      }}
                    >
                      <div
                        style={{
                          animation: `counter-spin-${categoryIndex} ${40 + categoryIndex * 10}s linear infinite`,
                        }}
                      >
                        <div
                          className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 md:px-4 md:py-2 md:text-sm"
                          style={{
                            backgroundColor: color.bg,
                            borderColor: color.border,
                            color: color.text,
                            boxShadow: `0 0 20px ${color.border}`,
                          }}
                        >
                          <Icon className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">{skill.name}</span>
                        </div>{' '}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-12 flex flex-wrap justify-center gap-6">
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
        /* Ring rotations - all centered with translate(-50%, -50%) */
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

        /* Counter-rotations - match ring offsets exactly */
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
