import React from 'react'
import { Zap, Play, Target, MousePointer2, Wrench } from 'lucide-react'

export default function SlingshotSection() {
  return (
    <section className="relative overflow-hidden bg-transparent px-6 py-24">
      <div className="bg-primary-mid/10 pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold tracking-widest text-amber-500 uppercase">
          <Wrench size={14} /> Leaderboard & Improvements Under Development
        </div>

        <h2 className="mb-6 text-6xl font-black tracking-tighter text-white uppercase italic md:text-8xl">
          Orbital <br />
          <span className="text-primary-light">Slingshot</span>
        </h2>

        <p className="mx-auto mb-12 max-w-xl font-mono text-sm leading-relaxed text-zinc-400">
          Navigate around a supermassive singularity with crushing gravitational
          pull. One launch. Extreme physics. Can you escape the event horizon?
        </p>

        <div className="mb-16 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20">
            <MousePointer2 className="text-primary-light mb-4" size={24} />
            <h3 className="mb-2 font-bold text-white">Launch Vector</h3>
            <p className="font-mono text-xs text-zinc-500">
              Drag to aim your trajectory. Precision is critical—the singularity
              warps spacetime itself.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20">
            <Zap className="text-primary-light mb-4" size={24} />
            <h3 className="mb-2 font-bold text-white">Event Horizon</h3>
            <p className="font-mono text-xs text-zinc-500">
              The black hole's immense gravity will pull you in. Too close means
              instant annihilation.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20">
            <Target className="text-primary-light mb-4" size={24} />
            <h3 className="mb-2 font-bold text-white">Stable Orbit</h3>
            <p className="font-mono text-xs text-zinc-500">
              Reach the target zone and maintain position. Master the physics to
              achieve orbital capture.
            </p>
          </div>
        </div>

        <a
          href="/slingshot"
          className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 font-black text-black shadow-xl shadow-white/10 transition-all hover:scale-105 active:scale-95"
        >
          START SIMULATION <Play size={20} fill="black" />
        </a>
      </div>
    </section>
  )
}
