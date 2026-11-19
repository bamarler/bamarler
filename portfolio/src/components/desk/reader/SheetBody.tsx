import Image from 'next/image'
import type { ReactNode } from 'react'
import type { Sheet } from '@/lib/desk/dossier'
import ContactBlock from './ContactBlock'
import Ink, { TypedLink } from './Ink'
import Paperclip from './Paperclip'
import { SCOTCH } from './paper'
import { useTilt } from './tilt'

// What's typed on each kind of sheet. Sizes are in container units (the sheet is the
// container), so a sheet reads like the same printed page at any screen size.

const HEADING =
  'font-[family-name:var(--font-typewriter)] leading-[1.1] text-balance [filter:url(#ink)]'

/** titles get smaller as they get longer, so a long company name doesn't take the page */
const titleSize = (text: string) => ({
  fontSize: `${text.length <= 14 ? 6.6 : text.length <= 24 ? 5.4 : 4.4}cqw`,
})

function Header({ left, right }: { left: string; right?: string }) {
  if (!left && !right) return null
  return (
    <div className="mb-[5cqw] flex justify-between border-b border-[#2a2520]/40 pb-[1cqw] text-[max(10px,2cqw)] tracking-[0.2em] text-[#2a2520]/60 uppercase">
      <span>{left}</span>
      {right && <span>{right}</span>}
    </div>
  )
}

/** A photo print stuck to the sheet: white border, a little gloss, film grain, corners
 *  lifting off the paper. Held by two strips of tape, or a paperclip over the top edge.
 *  Stuck down at a random angle (tilt.ts), with room left around it for the corners of a
 *  turned print so it doesn't land on the text. `width` is a fraction of the text column. */
function Photo({
  src,
  alt,
  width,
  className = '',
  float = false,
  hold = 'tape',
  portrait = false,
}: {
  src: string
  alt: string
  width: number
  className?: string
  float?: boolean
  hold?: 'tape' | 'clip'
  portrait?: boolean
}) {
  const tilt = useTilt(src)
  // a turned print's bounding box grows; percentages here are of the column's width
  const t = (Math.abs(tilt) * Math.PI) / 180
  const aspect = portrait ? 1.25 : 0.625
  const taller = (width * (Math.sin(t) + aspect * (Math.cos(t) - 1))) / 2
  const wider = (width * (Math.cos(t) - 1 + aspect * Math.sin(t))) / 2
  return (
    <div
      className={`${float ? 'float-right' : ''} ${className}`}
      style={{
        width: `${width * 100}%`,
        paddingBlock: `${Math.max(0, taller) * 100}%`,
        marginLeft: float ? `calc(4cqw + ${Math.max(0, wider) * 100}%)` : undefined,
      }}
    >
    <figure className="relative isolate" style={{ rotate: `${tilt}deg` }}>
      {/* lifted corners throw a deeper shadow than the middle */}
      <span
        aria-hidden
        className="absolute bottom-[1.2cqw] left-[3%] -z-10 h-1/4 w-2/5 rotate-[-3deg] shadow-[0_1.4cqw_1.2cqw_rgba(0,0,0,0.25)]"
      />
      <span
        aria-hidden
        className="absolute right-[3%] bottom-[1.2cqw] -z-10 h-1/4 w-2/5 rotate-[3deg] shadow-[0_1.4cqw_1.2cqw_rgba(0,0,0,0.25)]"
      />
      <div className="bg-[#fbfaf5] p-[1.8cqw] shadow-[0_0.2cqw_0.4cqw_rgba(0,0,0,0.25)]">
        <div
          className={`relative w-full overflow-hidden bg-[#d9d2c3] ${portrait ? 'aspect-[4/5]' : 'aspect-[16/10]'}`}
        >
          <Image
            src={src}
            alt={alt}
            fill
            quality={75}
            sizes="(max-width: 640px) 70vw, 360px"
            className="object-cover [filter:sepia(0.12)_saturate(0.88)_contrast(0.96)_brightness(1.03)]"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-[url(/desk/grain.webp)] bg-[length:128px] opacity-[0.09]"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.16)_45%,rgba(255,255,255,0)_62%)]"
          />
        </div>
      </div>
      {hold === 'clip' ? (
        <Paperclip className="absolute -top-[4.5cqw] left-[14%] h-[13cqw] w-[4.6cqw] -rotate-3" />
      ) : (
        <>
          <span
            aria-hidden
            className="absolute -top-[1.4cqw] -left-[3cqw] h-[4cqw] w-[14cqw] -rotate-[38deg]"
            style={SCOTCH}
          />
          <span
            aria-hidden
            className="absolute -top-[1.4cqw] -right-[3cqw] h-[4cqw] w-[14cqw] rotate-[38deg]"
            style={SCOTCH}
          />
        </>
      )}
    </figure>
    </div>
  )
}

function Stamp({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={`inline-block rounded-[1cqw] border-[0.6cqw] border-current px-[2cqw] py-[0.6cqw] font-[family-name:var(--font-typewriter)] tracking-[0.15em] text-[#a3322a]/70 uppercase mix-blend-multiply ${className}`}
    >
      {children}
    </span>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function SheetBody({ sheet }: { sheet: Sheet }) {
  switch (sheet.kind) {
    case 'cover':
      return (
        <div className="flex h-full flex-col items-center justify-center text-center">
          {sheet.header && (
            <p className="text-[max(10px,2.2cqw)] tracking-[0.35em] text-[#2a2520]/60 uppercase">
              {sheet.header}
            </p>
          )}
          <h1 className={`${HEADING} mt-[3cqw] text-[11cqw]`}>{sheet.name}</h1>
          {sheet.tagline && (
            <p className="mt-[3cqw] max-w-[80%] text-[max(13px,3cqw)]">
              {sheet.tagline}
            </p>
          )}
          {sheet.photo && (
            <Photo
              src={sheet.photo}
              alt={sheet.name}
              width={0.32}
              portrait
              className="mt-[5cqw]"
            />
          )}
          {sheet.contact && (
            <ContactBlock contact={sheet.contact} className="mt-[6cqw] text-left" />
          )}
        </div>
      )

    case 'profile':
      return (
        <>
          <Header left={sheet.header} />
          <h2 className={HEADING} style={titleSize(sheet.title)}>
            {sheet.title}
          </h2>
          {sheet.photo && (
            <Photo
              src={sheet.photo}
              alt=""
              width={0.42}
              float
              className="mt-[3cqw] mb-[3cqw]"
            />
          )}
          <Ink text={sheet.body} className="mt-[4cqw]" />
          {sheet.interests.length > 0 && (
            <div className="clear-both pt-[5cqw]">
              {sheet.interestsLabel && (
                <p className="text-[max(10px,2cqw)] tracking-[0.2em] text-[#2a2520]/60 uppercase">
                  {sheet.interestsLabel}
                </p>
              )}
              <ul className="mt-[1.5cqw]">
                {sheet.interests.map((i) => (
                  <li key={i}>[x] {i}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )

    case 'freeform':
      return (
        <>
          <Header left={sheet.header} />
          <h2 className={HEADING} style={titleSize(sheet.title)}>
            {sheet.title}
          </h2>
          {sheet.photo && (
            <Photo
              src={sheet.photo}
              alt=""
              width={0.7}
              className="my-[5cqw]"
            />
          )}
          <Ink text={sheet.body} className="mt-[4cqw]" />
        </>
      )

    case 'experience':
      return (
        <>
          <Header
            left={sheet.header}
            right={`${pad(sheet.index)} / ${pad(sheet.total)}`}
          />
          <div className="flex items-start justify-between gap-[3cqw]">
            <h2 className={HEADING} style={titleSize(sheet.company)}>
              {sheet.company}
            </h2>
            <Stamp className="mt-[1cqw] shrink-0 rotate-[4deg] text-[max(10px,2.4cqw)]">
              {sheet.period}
            </Stamp>
          </div>
          <p className="mt-[1.5cqw] font-bold">{sheet.role}</p>
          {sheet.photo && (
            <Photo
              src={sheet.photo}
              alt={sheet.company}
              width={0.66}
              className="mx-auto my-[5cqw]"
            />
          )}
          <Ink text={sheet.body} />
        </>
      )

    case 'project':
      return (
        <>
          <Header
            left={sheet.header}
            right={`${pad(sheet.index)} / ${pad(sheet.total)}`}
          />
          <h2 className={HEADING} style={titleSize(sheet.title)}>
            {sheet.title}
          </h2>
          {sheet.photo && (
            <Photo
              src={sheet.photo}
              alt={sheet.title}
              width={0.66}
              className="mx-auto my-[5cqw]"
            />
          )}
          <Ink text={sheet.body} />
          {sheet.tools.length > 0 && (
            <p className="mt-[5cqw]">
              {sheet.toolsLabel && <span className="text-[#2a2520]/60">{sheet.toolsLabel}: </span>}
              {sheet.tools.join(' · ')}
            </p>
          )}
          {sheet.links.length > 0 && (
            <p className="mt-[2cqw] flex gap-[4cqw]">
              {sheet.links.map((l) => (
                <TypedLink key={l.url} href={l.url}>
                  {l.label} →
                </TypedLink>
              ))}
            </p>
          )}
        </>
      )

    case 'skills':
      return (
        <>
          <Header left={sheet.header} />
          <div className="space-y-[5cqw]">
            {sheet.categories.map((c) => (
              <section key={c.name}>
                <h3 className={`${HEADING} mb-[1.5cqw] text-[4.2cqw]`}>
                  {c.name}
                </h3>
                <ul>
                  {c.skills.map((s) => (
                    <li
                      key={s.name}
                      className="flex justify-between gap-[2cqw]"
                    >
                      <span>{s.name}</span>
                      {s.proficiency !== null && (
                        <span
                          aria-label={`${s.proficiency} percent`}
                          className="tracking-[-0.05em] whitespace-pre text-[#2a2520]/75"
                        >
                          {'■'
                            .repeat(Math.round(s.proficiency / 10))
                            .padEnd(10, '□')}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )

    case 'contact':
      return (
        <>
          <Header left={sheet.header} />
          <h2 className={HEADING} style={titleSize(sheet.title)}>
            {sheet.title}
          </h2>
          {sheet.body && <Ink text={sheet.body} className="mt-[3cqw]" />}
          <ContactBlock contact={sheet.contact} className="mt-[6cqw]" />
        </>
      )
  }
}
