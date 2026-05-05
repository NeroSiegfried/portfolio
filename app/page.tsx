import { Analytics } from "@vercel/analytics/next"
import Hero from "@/components/hero"
import About from "@/components/about"
import Projects from "@/components/projects"
import TechStack from "@/components/tech-stack"
import Contact from "@/components/contact"
import Footer from "@/components/footer"

// Analytics is a no-op when VERCEL env var is absent (e.g. Amplify, local dev)
const isVercel = !!process.env.VERCEL

export default function Home() {
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
