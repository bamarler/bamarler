import type { Metadata } from 'next'
import Link from 'next/link'
import SceneLoader from '@/components/desk/SceneLoader'
import { getDeskContent } from '@/lib/desk/content'

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getDeskContent()
  return name ? { title: name } : {}
}

export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<{ poster?: string }>
}) {
  // ?poster renders a clean frame for scripts/desk-poster.mjs
  const poster = (await searchParams).poster !== undefined
  const { experiences, projects, sheets, framePhotos, folder, name, error } = await getDeskContent()
  // section headings as the dossier gives them
  const heading = (kind: string) => sheets.find((s) => s.kind === kind)?.header

  return (
    <main className="h-full w-full">
      <SceneLoader poster={poster} sheets={sheets} framePhotos={framePhotos} folder={folder} />

      {/* Server-rendered text layer: readable by search engines and screen readers. */}
      <section className="sr-only">
        {name && <h1>{name}</h1>}
        {heading('experience') && <h2>{heading('experience')}</h2>}
        <ul>
          {experiences.map((e) => (
            <li key={e.id}>
              {e.role}, {e.company} ({e.period})
            </li>
          ))}
        </ul>
        {heading('project') && <h2>{heading('project')}</h2>}
        <ul>
          {projects.map((p) => (
            <li key={p.id}>{p.title}</li>
          ))}
        </ul>
      </section>

      {/* the models are credited by licence (CC-BY), so the link is always there */}
      {!poster && (
        <Link
          href="/credits"
          className="pointer-events-auto absolute right-3 bottom-2 font-mono text-[11px] text-white/45 underline-offset-2 hover:text-white/80 hover:underline"
        >
          credits
        </Link>
      )}
      {/* dev only: what the server got from Supabase */}
      {!poster && process.env.NODE_ENV === 'development' && (
        <div className="pointer-events-none absolute right-4 bottom-8 max-w-xs rounded bg-black/60 p-3 font-mono text-xs leading-relaxed pointer-coarse:hidden">
          <p className="font-bold">dev status</p>
          <p>
            supabase (server):{' '}
            {error ? `skipped (${error})` : `${experiences.length} experiences, ${projects.length} projects`}
          </p>
        </div>
      )}
    </main>
  )
}
