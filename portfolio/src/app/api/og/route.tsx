import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  const fontData = await readFile(
    join(process.cwd(), 'public/fonts/SpaceGrotesk-Bold.ttf'),
  )

  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || ''
  const profileUrl = `https://${projectId}.supabase.co/storage/v1/object/public/assets/profile_picture.jpg`

  return new ImageResponse(
    <div
      style={{
        background: '#0a0414',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Space Grotesk',
      }}
    >
      {/* Subtle radial glow behind photo */}
      <div
        style={{
          position: 'absolute',
          left: '180px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(142,69,133,0.25) 0%, rgba(10,4,20,0) 70%)',
          display: 'flex',
        }}
      />

      {/* Orbital path decorations */}
      <svg
        width="1200"
        height="630"
        viewBox="0 0 1200 630"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.15 }}
      >
        <path
          d="M-100,350 Q400,100 900,500 T1900,350"
          fill="none"
          stroke="#c4739b"
          strokeWidth="1.5"
          strokeDasharray="8,8"
        />
        <path
          d="M-100,500 Q600,650 1200,300 T2000,500"
          fill="none"
          stroke="#8e4585"
          strokeWidth="1"
        />
        <circle cx="1050" cy="120" r="2.5" fill="#f59e0b" />
        <circle cx="200" cy="80" r="2" fill="#c4739b" />
      </svg>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 80,
          padding: '0 80px',
          position: 'relative',
        }}
      >
        {/* Profile photo */}
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 60px rgba(142,69,133,0.3)',
            display: 'flex',
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profileUrl}
            alt="Benjamin Marler"
            width={280}
            height={280}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        </div>

        {/* Text content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Name */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontSize: 86,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              Benjamin
            </span>
            <span
              style={{
                fontSize: 86,
                fontWeight: 700,
                fontStyle: 'italic',
                lineHeight: 1,
                letterSpacing: '-0.04em',
                backgroundImage:
                  'linear-gradient(135deg, #410056 0%, #8e4585 50%, #c4739b 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Marler
            </span>
          </div>

          {/* Co-op badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(245,158,11,0.3)',
              background: 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              borderRadius: 9999,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              alignSelf: 'flex-start',
            }}
          >
            SEEKING MAY-DEC 2026 CO-OP
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 22,
              color: '#c1b3cd',
              lineHeight: 1.5,
              maxWidth: 480,
              display: 'flex',
            }}
          >
            {'// Engineering systems where physics meets agentic intelligence.'}
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Space Grotesk',
          data: fontData,
          weight: 700 as const,
          style: 'normal' as const,
        },
      ],
    },
  )
}
