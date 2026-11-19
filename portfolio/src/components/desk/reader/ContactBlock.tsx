import type { ReactNode } from 'react'
import { revealEmail, type Contact, type DossierLink } from '@/lib/desk/dossier'
import { TypedLink } from './Ink'

// How to reach Ben, typed on the sheet: location, email written out, profiles with their
// logos, and the resume. Logos are inked in the typewriter colour so they sit in the type.
// Each icon has an explicit width and height: Safari won't size an SVG from aspect alone.

const ICON = 'inline-block h-[1.05em] w-[1.05em] shrink-0 align-[-0.15em] opacity-80'

function GitHubMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={ICON} fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

function LinkedInMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={ICON} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

/** the logo for a profile link, by where it points */
function logoFor(url: string): ReactNode {
  if (/(^|\.|\/)github\.com/i.test(url)) return <GitHubMark />
  if (/(^|\.|\/)linkedin\.com/i.test(url)) return <LinkedInMark />
  return <span aria-hidden>→</span>
}

/** the address, unscrambled in the browser so it's never plain text in the page source */
function Email({ scrambled }: { scrambled: string }) {
  const address = revealEmail(scrambled)
  return <TypedLink href={`mailto:${address}`}>{address}</TypedLink>
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-[1.6cqw]">
      {icon}
      <span className="min-w-0 break-words">{children}</span>
    </li>
  )
}

export default function ContactBlock({ contact, className = '' }: { contact: Contact; className?: string }) {
  const { location, email, links, resume, resumeLabel } = contact
  return (
    <ul className={`space-y-[1.4cqw] ${className}`}>
      {location && <Row icon={<span aria-hidden>⌂</span>}>{location}</Row>}
      {email && (
        <Row icon={<span aria-hidden>@</span>}>
          <Email scrambled={email} />
        </Row>
      )}
      {links.map((l: DossierLink) => (
        <Row key={l.url} icon={logoFor(l.url)}>
          <TypedLink href={l.url}>{l.label}</TypedLink>
        </Row>
      ))}
      {resume && (
        <Row icon={<span aria-hidden>¶</span>}>
          <TypedLink href={resume}>{resumeLabel || resume.replace(/^https?:\/\/(www\.)?/, '')}</TypedLink>
        </Row>
      )}
    </ul>
  )
}
