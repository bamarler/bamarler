'use client'

import { useEffect, useRef, useState } from 'react'

interface CanvasSize {
  width: number
  height: number
  dpr: number
}

export function useCanvasSize(containerRef: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<CanvasSize>({ width: 0, height: 0, dpr: 1 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const dpr = Math.min(window.devicePixelRatio, 2)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width, height, dpr })
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  return size
}

export function applyCanvasSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number,
) {
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
  return ctx
}
