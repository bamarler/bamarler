'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Github, ExternalLink } from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  tech_stack: string[]
  github_url: string | null
  live_url: string | null
  image_name: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true })

      if (data) setProjects(data)
    }
    fetchProjects()
  }, [])

  return (
    <section id="projects" className="bg-bg-dark py-24">
      <div className="container mx-auto px-6">
        <div className="mb-12 text-center lg:text-left">
          <h2 className="font-heading text-4xl font-bold tracking-tight italic">
            Selected Projects
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const { data: imgData } = supabase.storage
              .from('assets')
              .getPublicUrl(project.image_name)

            return (
              <div key={project.id} className="group relative">
                {/* Amber aura on hover - behind the card */}
                <div className="bg-accent-primary pointer-events-none absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-30" />

                <div className="bg-bg-dark relative z-10 flex flex-col rounded-2xl border border-white/10 p-4 shadow-2xl transition-all duration-500">
                  <div className="relative bg-bg-dark mb-6 aspect-video overflow-hidden rounded-lg border border-white/10">
                    {imgData?.publicUrl && (
                      <Image
                        src={imgData.publicUrl}
                        alt={project.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-heading group-hover:text-accent-primary mb-2 text-xl font-bold transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-text-muted mb-6 line-clamp-3 text-sm leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2">
                    {project.tech_stack.map((tech) => (
                      <span
                        key={tech}
                        className="text-text-muted rounded border border-white/5 bg-white/5 px-2 py-1 font-mono text-[10px] font-bold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-accent-primary transition-colors"
                      >
                        <Github size={18} />
                      </a>
                    )}
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-accent-primary transition-colors"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
