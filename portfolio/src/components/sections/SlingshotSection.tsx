import React from 'react'
import { Play, Wrench } from 'lucide-react'

export default function SlingshotSection() {
  return (
    <section className="relative h-full w-full bg-transparent px-6 py-24">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary-mid/20 blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold tracking-widest text-amber-500 uppercase">
          <Wrench size={14} /> Leaderboard & Improvements Under Development
        </div>

        <h2 className="mb-6 text-6xl font-black tracking-tighter text-white uppercase italic md:text-8xl">
          Orbital <br />
          <span className="text-primary-light">Slingshot</span>
        </h2>

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
