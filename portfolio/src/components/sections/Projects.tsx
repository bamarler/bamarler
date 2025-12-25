'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import { Github, ExternalLink, Code2 } from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  tech_stack: string[]
  github_url: string
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
        <div className="mb-16 flex items-end justify-between">
          <div>
            <h2 className="font-heading mb-4 text-4xl font-bold italic">
              Selected Projects
            </h2>
            <p className="text-text-muted font-mono text-sm tracking-tight">{`// Engineering logic & physical simulations`}</p>
          </div>
          <a
            href="https://github.com/bamarler"
            target="_blank"
            className="text-primary-light hidden items-center gap-2 text-sm font-bold transition-colors hover:text-white md:flex"
          >
            <Github size={20} />
            <span>SEE ALL REPOS</span>
          </a>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            // Calculate URL during render to avoid React 19 cascading setState warnings
            const { data: imgData } = supabase.storage
              .from('assets')
              .getPublicUrl(project.image_name)

            return (
              <div
                key={project.id}
                className="group glass-card hover:border-primary-light/30 relative flex flex-col p-4 transition-all duration-500"
              >
                <div className="bg-bg-dark relative mb-6 aspect-video overflow-hidden rounded-lg">
                  {imgData?.publicUrl && (
                    <Image
                      src={imgData.publicUrl}
                      alt={project.title}
                      fill
                      className="object-cover opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  <div className="from-bg-dark/80 absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-60" />
                </div>

                <div className="flex-grow">
                  <h3 className="font-heading group-hover:text-primary-light mb-2 text-xl font-bold transition-colors">
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
                  <a
                    href={project.github_url}
                    target="_blank"
                    className="text-text-muted transition-colors hover:text-white"
                  >
                    <Github size={18} />
                  </a>
                  <a
                    href="#"
                    className="text-text-muted transition-colors hover:text-white"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
