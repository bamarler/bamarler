'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface Particle {
  x: number
  y: number
  targetX: number
  targetY: number
  originX: number
  originY: number
  size: number
  alpha: number
  color: string
}

const COLORS = ['#c4739b', '#8e4585', '#f59e0b', '#fbbf24', '#faf8fc']

function sampleTextParticles(
  text: string,
  font: string,
  canvasWidth: number,
  canvasHeight: number,
  isMobile: boolean,
): Particle[] {
  const offscreen = document.createElement('canvas')
  const ctx = offscreen.getContext('2d')
  if (!ctx) return []

  offscreen.width = canvasWidth
  offscreen.height = canvasHeight

  ctx.fillStyle = '#ffffff'
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  // Split into lines for two-line layout
  const lines = text.split('\n')
  const fontSize = parseInt(font)
  const lineHeight = fontSize * 1.15
  const totalHeight = lines.length * lineHeight
  const startY = canvasHeight / 2 - totalHeight / 2 + lineHeight / 2

  lines.forEach((line, i) => {
    ctx.fillText(line, canvasWidth / 2, startY + i * lineHeight)
  })

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const pixels = imageData.data

  const particles: Particle[] = []
  const gap = isMobile ? 4 : 3
  const maxParticles = isMobile ? 400 : 900

  for (let y = 0; y < canvasHeight; y += gap) {
    for (let x = 0; x < canvasWidth; x += gap) {
      const i = (y * canvasWidth + x) * 4
      if (pixels[i + 3] > 128) {
        particles.push({
          x: Math.random() * canvasWidth,
          y: Math.random() * canvasHeight,
          targetX: x,
          targetY: y,
          originX: Math.random() * canvasWidth,
          originY: Math.random() * canvasHeight,
          size: isMobile ? 1.2 : 1.5,
          alpha: 0.6 + Math.random() * 0.4,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        })
        if (particles.length >= maxParticles) return particles
      }
    }
  }

  return particles
}

export default function AsciiParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const progressRef = useRef(0)
  const rafRef = useRef<number>(0)
  const reducedMotion = useReducedMotion()

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.parentElement?.getBoundingClientRect()
    if (!rect) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    const width = rect.width
    const height = rect.height

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const isMobile = width < 768
    const fontSize = isMobile ? 36 : Math.min(120, width * 0.08)
    const font = `bold ${fontSize}px "Space Grotesk", sans-serif`

    particlesRef.current = sampleTextParticles(
      'BENJAMIN\nMARLER',
      font,
      width,
      height,
      isMobile,
    )
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    // Wait for fonts to load before measuring
    document.fonts.ready.then(() => {
      initParticles()
    })

    const handleResize = () => {
      document.fonts.ready.then(() => {
        initParticles()
      })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [initParticles, reducedMotion])

  // Scroll-driven progress: 0 = formed text, 1 = scattered
  useEffect(() => {
    if (reducedMotion) return

    const handleScroll = () => {
      const vh = window.innerHeight
      const scrollY = window.scrollY
      // Scatter as we scroll through the first viewport
      progressRef.current = Math.min(1, scrollY / (vh * 0.6))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [reducedMotion])

  // Animation loop
  useEffect(() => {
    if (reducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    let animationStart: number | null = null
    const FORM_DURATION = 2000 // 2s to coalesce on load

    const animate = (timestamp: number) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      if (animationStart === null) animationStart = timestamp
      const elapsed = timestamp - animationStart

      const dpr = Math.min(window.devicePixelRatio, 2)
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)

      const particles = particlesRef.current
      const scrollProgress = progressRef.current

      // Initial formation progress (0 to 1 over FORM_DURATION)
      const formProgress = Math.min(1, elapsed / FORM_DURATION)
      const eased = 1 - Math.pow(1 - formProgress, 3) // easeOutCubic

      for (const p of particles) {
        // Blend between origin (scattered) and target (formed text)
        // On load: lerp from origin to target over time
        // On scroll: lerp from target back to origin
        const formedX = p.originX + (p.targetX - p.originX) * eased
        const formedY = p.originY + (p.targetY - p.originY) * eased

        // Scatter: move from formed position back toward a random spread
        p.x = formedX + (p.originX - formedX) * scrollProgress
        p.y = formedY + (p.originY - formedY) * scrollProgress

        ctx.globalAlpha = p.alpha * (1 - scrollProgress * 0.5)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reducedMotion])

  if (reducedMotion) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  )
}
