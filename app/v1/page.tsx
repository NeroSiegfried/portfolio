import { Analytics } from "@vercel/analytics/next"
import Hero from "@/components/hero"
import About from "@/components/about"
import Projects from "@/components/projects"
import TechStack from "@/components/tech-stack"
import Contact from "@/components/contact"
import Footer from "@/components/footer"

// Preserved "v1" portfolio home — identical to the original app/page.tsx.
// The redesign builds new components; these existing ones remain the v1 library.
const isVercel = !!process.env.VERCEL

export default function V1Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {isVercel && <Analytics />}
      <Hero />
      <About />
      <Projects />
      <TechStack />
      <Contact />
      <Footer />
    </main>
  )
}
