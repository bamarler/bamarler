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
  const container = useRef<HTMLDivElement>(null)
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

    // Stagger category cards
    gsap.utils.toArray('.skill-category').forEach((card: unknown) => {
      gsap.from(card as Element, {
        opacity: 0,
        y: 60,
        duration: 0.8,
        scrollTrigger: {
          trigger: card as Element,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      })
    })

    // Animate progress bars
    gsap.utils.toArray('.skill-bar-fill').forEach((bar: unknown) => {
      const element = bar as HTMLElement
      const width = element.dataset.proficiency || '0'
      gsap.fromTo(
        element,
        { width: '0%' },
        {
          width: `${width}%`,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        },
      )
    })
  }, [groupedSkills])

  return (
    <section
      id="skills"
      ref={container}
      className="container mx-auto px-6 py-32"
    >
      <div className="mb-16">
        <h2 className="font-heading text-4xl font-bold italic md:text-5xl">
          Technical Arsenal
        </h2>
        <p className="text-text-muted mt-4 font-mono text-sm tracking-widest">{`// TOOLS OF THE TRADE`}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {groupedSkills.map(({ category, skills }) => (
          <div
            key={category.id}
            className="skill-category glass-card rounded-2xl border border-white/10 p-6"
          >
            <h3 className="text-primary-light mb-6 font-mono text-sm font-bold tracking-widest uppercase">
              {category.name}
            </h3>

            <div className="space-y-4">
              {skills.map((skill) => {
                const Icon = skill.icon_name
                  ? iconMap[skill.icon_name] || Code
                  : Code

                return (
                  <div key={skill.id} className="group">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="text-text-muted h-4 w-4 transition-colors group-hover:text-accent-primary" />
                        <span className="text-text-primary font-medium">
                          {skill.name}
                        </span>
                      </div>
                      {skill.proficiency && (
                        <span className="text-text-muted font-mono text-xs">
                          {skill.proficiency}%
                        </span>
                      )}
                    </div>

                    {skill.proficiency && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="skill-bar-fill bg-gradient-to-r from-primary-dark via-primary to-primary-light h-full rounded-full"
                          data-proficiency={skill.proficiency}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
