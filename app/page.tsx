import { ModeToggle } from "@/components/mode-toggle"
import { Analytics } from "@vercel/analytics/next"
import Hero from "@/components/hero"
import About from "@/components/about"
import Projects from "@/components/projects"
import TechStack from "@/components/tech-stack"
import Contact from "@/components/contact"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Analytics />
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div>
      <Hero />
      <About />
      <Projects />
      <TechStack />
      <Contact />
      <Footer />
    </main>
  )
}
