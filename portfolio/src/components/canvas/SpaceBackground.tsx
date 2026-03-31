'use client'

import { useRef, useEffect } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface Star {
  x: number
  y: number
  size: number
  baseAlpha: number
  twinkleSpeed: number
  twinkleOffset: number
  color: string
}

const STAR_COLORS = [
  '#ffffff',
  '#ffffff',
  '#ffffff',
  '#faf8fc',
  '#faf8fc',
  '#c4739b',
  '#f59e0b',
]

function createStars(width: number, count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random(), // 0-1 normalized, will be mapped to viewport
    size: Math.random() * 1.5 + 0.5,
    baseAlpha: Math.random() * 0.5 + 0.3,
    twinkleSpeed: Math.random() * 0.002 + 0.001,
    twinkleOffset: Math.random() * Math.PI * 2,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
  }))
}

export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const scrollRef = useRef(0)
  const rafRef = useRef<number>(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const isMobile = w < 768
      starsRef.current = createStars(w, isMobile ? 40 : 80)
    }

    resize()
    window.addEventListener('resize', resize)

    const handleScroll = () => {
      scrollRef.current = window.scrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    const animate = (timestamp: number) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = Math.min(window.devicePixelRatio, 2)
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const scroll = scrollRef.current
      const isMobile = w < 768
      // Parallax: shift stars slowly relative to scroll. Each star wraps around.
      const parallaxFactor = isMobile ? 0 : 0.03

      for (const star of starsRef.current) {
        const twinkle = Math.sin(
          timestamp * star.twinkleSpeed + star.twinkleOffset,
        )
        const alpha = star.baseAlpha + twinkle * 0.2

        // Map normalized y to viewport, offset by scroll parallax, wrap around
        let drawY = (star.y * h - scroll * parallaxFactor) % h
        if (drawY < 0) drawY += h

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
        ctx.fillStyle = star.color
        ctx.beginPath()
        ctx.arc(star.x, drawY, star.size, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [reducedMotion])

  if (reducedMotion) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  )
}
