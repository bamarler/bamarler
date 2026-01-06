import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        background:
          'linear-gradient(135deg, #410056 0%, #8e4585 50%, #c4739b 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui',
      }}
    >
      <h1 style={{ fontSize: 80, fontWeight: 'bold' }}>Benjamin Marler</h1>
      <p style={{ fontSize: 40, opacity: 0.9 }}>
        Software Engineer | CS & Physics @ Northeastern
      </p>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
