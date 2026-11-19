import type { ReactNode } from 'react'

// The small slice of Markdown the dossier needs: paragraphs (blank lines), line breaks,
// **bold**, *italic* and [links](url). Builds React elements, never raw HTML.

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\)|\n)/g
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/
const SAFE_URL = /^(https?:\/\/|mailto:|\/)/

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null
    if (part === '\n') return <br key={i} />
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    const link = part.match(LINK)
    if (link && SAFE_URL.test(link[2])) return <TypedLink key={i} href={link[2]}>{link[1]}</TypedLink>
    return part
  })
}

export function TypedLink({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:\/\//.test(href)
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="underline decoration-[#a3322a]/60 decoration-2 underline-offset-2 hover:decoration-[#a3322a]"
    >
      {children}
    </a>
  )
}

export default function Ink({ text, className = '' }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return (
    <div className={`space-y-[0.9em] ${className}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{inline(p)}</p>
      ))}
    </div>
  )
}
