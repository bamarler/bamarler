import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Experience from '@/components/sections/Experience'
import Projects from '@/components/sections/Projects'
import Skills from '@/components/sections/Skills'
import SlingshotSection from '@/components/sections/SlingshotSection'
import Contact from '@/components/sections/Contact'
import SpaceBackground from '@/components/canvas/SpaceBackground'

export default function Home() {
  return (
    <>
      <SpaceBackground />
      <div className="relative z-10">
        <Navbar />
        <main className="flex min-h-screen flex-col">
          <Hero />
          <About />
          <Experience />
          <Projects />
          <Skills />

          {/* Phase 4: The Slingshot Game - Centered and Fluid */}
          <section
            id="game"
            className="flex min-h-screen flex-col items-center justify-center border-t border-white/5 px-6 py-24"
          >
            <SlingshotSection />
          </section>
        </main>
        <Contact />
      </div>
    </>
  )
}
