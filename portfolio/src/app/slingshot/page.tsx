'use client'

import React, { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import {
  RefreshCcw,
  Trophy,
  Zap,
  Target,
  MousePointer2,
  Lock,
  ArrowLeft,
} from 'lucide-react'

export default function SlingshotPage() {
  const scene = useRef<HTMLDivElement>(null)
  const [game, setGame] = useState({
    status: 'aiming', // 'aiming', 'launched', 'won', 'lost'
    score: 0,
    attempts: 0,
  })

  const [hasLaunched, setHasLaunched] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [gameKey, setGameKey] = useState(0)

  const isActivatedRef = useRef(false)
  const dragData = useRef<{
    start: Matter.Vector
    current: Matter.Vector
    active: boolean
  } | null>(null)

  // 1. SCROLL LOCK: Prevent page movement
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  useEffect(() => {
    if (!scene.current) return

    const {
      Engine,
      Render,
      Runner,
      World,
      Bodies,
      Mouse,
      Events,
      Vector,
      Body,
      Composite,
    } = Matter

    const cw = scene.current.clientWidth
    const ch = scene.current.clientHeight

    const engine = Engine.create()
    engine.gravity.y = 0

    const render = Render.create({
      element: scene.current,
      engine: engine,
      options: {
        width: cw,
        height: ch,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    })

    const planet = Bodies.circle(cw / 2, ch / 2, 80, {
      // Increased size from 70 to 80
      isStatic: true,
      render: {
        fillStyle: '#1a0a1f', // Dark purple, almost black
        strokeStyle: '#8e4585', // Purple glow
        lineWidth: 4,
      },
      label: 'planet',
    })

    const goal = Bodies.circle(cw - 200, 200, 65, {
      isStatic: true,
      isSensor: true,
      render: {
        fillStyle: 'rgba(210, 171, 103, 0.1)',
        strokeStyle: '#d2ab67',
        lineWidth: 3,
      },
      label: 'goal',
    })

    const anchor = { x: 250, y: ch - 250 }
    const agent = Bodies.circle(anchor.x, anchor.y, 18, {
      mass: 2,
      frictionAir: 0.001,
      render: { fillStyle: '#ffffff' },
      label: 'agent',
    })

    World.add(engine.world, [planet, goal, agent])

    // Physics Loop
    Events.on(engine, 'beforeUpdate', () => {
      if (!isActivatedRef.current) {
        Body.setVelocity(agent, { x: 0, y: 0 })
        Body.setPosition(agent, anchor)
        return
      }

      if (agent.isStatic) return

      const delta = Vector.sub(planet.position, agent.position)
      const distance = Vector.magnitude(delta)

      if (distance > 20) {
        // BLACK HOLE GRAVITY: Much stronger pull
        const forceMagnitude = (0.025 * agent.mass) / (distance * 0.015) // 5x stronger
        const force = Vector.mult(Vector.normalise(delta), forceMagnitude)
        Body.applyForce(agent, agent.position, force)
      }
      if (
        agent.position.x < -1000 ||
        agent.position.x > cw + 1000 ||
        agent.position.y < -1000 ||
        agent.position.y > ch + 1000
      ) {
        setGame((prev) => ({ ...prev, status: 'lost' }))
      }
    })

    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label]
        const currentAgent =
          pair.bodyA.label === 'agent'
            ? pair.bodyA
            : pair.bodyB.label === 'agent'
              ? pair.bodyB
              : null
        if (currentAgent && labels.includes('goal')) {
          Body.setStatic(currentAgent, true)
          setGame((prev) => ({
            ...prev,
            status: 'won',
            score: prev.score + 100,
          }))
        }
        if (currentAgent && labels.includes('planet')) {
          Composite.remove(engine.world, currentAgent)
          setGame((prev) => ({ ...prev, status: 'lost' }))
        }
      })
    })

    // Coordinate Mapping & Interaction Logic
    const mouse = Mouse.create(render.canvas)
    mouse.pixelRatio = render.options.pixelRatio ?? 1

    Events.on(engine, 'beforeUpdate', () => {
      if (isActivatedRef.current) return

      const mPos = mouse.position
      const dist = Vector.magnitude(Vector.sub(mPos, anchor))
      // BOUNDARY SET TO 100px
      const near = dist < 50

      setIsHovering(near)

      if (mouse.button === 0 && near && !dragData.current) {
        dragData.current = { start: { ...anchor }, current: mPos, active: true }
        agent.render.fillStyle = '#d2ab67'
      }

      if (dragData.current?.active) {
        dragData.current.current = mPos
      }
    })

    const handleMouseUp = () => {
      if (dragData.current?.active && !isActivatedRef.current) {
        isActivatedRef.current = true
        setHasLaunched(true)

        // POWER FIX: Recalculate based on real-time mouse position to prevent "slow release" bug
        const mPos = mouse.position
        const launchVector = Vector.sub(anchor, mPos)
        const powerScale = 0.055 // Tuned for the 100px radius
        Body.applyForce(
          agent,
          agent.position,
          Vector.mult(launchVector, (powerScale * agent.mass) / 100),
        )

        dragData.current = null
        agent.render.fillStyle = '#ffffff'
        setIsHovering(false)
        setGame((prev) => ({ ...prev, status: 'launched' }))
      }
    }

    window.addEventListener('mouseup', handleMouseUp)

    // Visual Layer
    Events.on(render, 'afterRender', () => {
      const ctx = render.context

      // Slingshot visuals
      if (dragData.current?.active) {
        const start = anchor
        const diff = Vector.sub(start, dragData.current.current)
        const end = Vector.add(start, diff)

        ctx.beginPath()
        ctx.setLineDash([10, 5])
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.strokeStyle = '#d2ab67'
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.setLineDash([])

        ctx.beginPath()
        ctx.arc(end.x, end.y, 8, 0, Math.PI * 2)
        ctx.fillStyle = '#d2ab67'
        ctx.fill()
      }
    })

    Render.run(render)
    const runner = Runner.create()
    Runner.run(runner, engine)

    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      Render.stop(render)
      Runner.stop(runner)
      World.clear(engine.world, false)
      Engine.clear(engine)
      render.canvas.remove()
    }
  }, [gameKey, isHovering]) // Re-run effect when hovering state changes to update canvas visuals

  const handleReset = () => {
    isActivatedRef.current = false
    setHasLaunched(false)
    setGame((prev) => ({
      ...prev,
      status: 'aiming',
      attempts: prev.attempts + 1,
    }))
    setGameKey((prev) => prev + 1)
  }

  return (
    <div className="selection:bg-primary-light/30 fixed inset-0 flex flex-col overflow-hidden bg-[#0a0a0c] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[100] flex items-start justify-between p-8">
        <div className="pointer-events-auto flex flex-col gap-6">
          <a
            href="/"
            className="flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-zinc-500 uppercase transition-colors hover:text-white"
          >
            <ArrowLeft size={14} /> Back to Orbit
          </a>
          <div className="flex gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
              <span className="mb-1 block text-[10px] font-bold text-zinc-500 uppercase">
                Trial
              </span>
              <span className="text-primary-light font-mono text-2xl">
                {game.attempts + 1}
              </span>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-md">
              <span className="mb-1 block text-[10px] font-bold text-zinc-500 uppercase">
                Score
              </span>
              <span className="text-accent-primary font-mono text-2xl">
                {game.score}
              </span>
            </div>
          </div>
        </div>
        <div className="pointer-events-auto">
          <button
            onClick={handleReset}
            className="rounded-full border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/20"
          >
            <RefreshCcw size={24} />
          </button>
        </div>
      </div>

      <div
        ref={scene}
        className={`flex-1 ${hasLaunched ? 'cursor-not-allowed' : isHovering ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      />

      <div className="pointer-events-none absolute inset-0 z-[150] flex items-center justify-center">
        {game.status === 'won' && (
          <div className="border-accent-primary/50 animate-in zoom-in pointer-events-auto rounded-[50px] border bg-black/95 p-16 text-center shadow-2xl backdrop-blur-3xl duration-300">
            <Target size={80} className="text-accent-primary mx-auto mb-8" />
            <h2 className="mb-4 text-6xl font-black tracking-tighter italic">
              CAPTURE COMPLETE
            </h2>
            <p className="mb-12 font-mono text-xs tracking-widest text-zinc-500 uppercase">
              Solution achieved in {game.attempts + 1} attempts.
            </p>
            <button
              onClick={handleReset}
              className="bg-accent-primary w-full rounded-2xl py-5 font-black tracking-widest text-black uppercase transition-all hover:scale-105"
            >
              Recalibrate Vector
            </button>
          </div>
        )}
        {game.status === 'lost' && (
          <div className="animate-in slide-in-from-bottom-12 pointer-events-auto rounded-[50px] border border-red-500/30 bg-black/95 p-16 text-center backdrop-blur-3xl">
            <h2 className="mb-8 text-6xl font-black tracking-tighter text-red-500 uppercase italic">
              MISSION FAILED
            </h2>
            <button
              onClick={handleReset}
              className="rounded-2xl bg-white px-16 py-5 font-black tracking-widest text-black uppercase transition-all hover:bg-zinc-200"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {!hasLaunched && (
        <div
          className={`pointer-events-none absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-20'}`}
        >
          <MousePointer2
            size={24}
            className={isHovering ? 'text-primary-light animate-bounce' : ''}
          />
          <span className="font-mono text-[10px] tracking-[0.5em] uppercase">
            {isHovering ? 'Engage Slingshot' : 'Move cursor into boundary'}
          </span>
        </div>
      )}
    </div>
  )
}
