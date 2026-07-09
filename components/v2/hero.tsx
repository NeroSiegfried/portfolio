import { ArrowDown } from "lucide-react"
import { Eyebrow } from "@/components/v2/primitives"
import { RevealLines } from "@/components/v2/reveal"

/**
 * Full-bleed sticky hero (portfolie): a minimal heading + subheading over a
 * full-bleed image; the framed content below scrolls up and slides over it.
 * The image is a placeholder for now (see the note).
 */
export function Hero() {
  return (
    <section id="top" className="sticky top-0 h-screen w-full overflow-hidden bg-secondary">
      {/* Placeholder for the full-bleed hero visual. */}
      <div className="absolute inset-0 flex items-start justify-center p-10 pt-32">
        <p className="max-w-md text-center font-mono text-[0.7rem] uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
          Placeholder — full-bleed hero image
          <span className="mt-3 block normal-case tracking-normal opacity-70">
            A bold, editorially-lit portrait or an abstract tech visual (light-trails / fibre optics
            / circuitry), high-contrast with one dominant accent — sits full-bleed behind the name.
          </span>
        </p>
      </div>

      {/* Legibility gradient for the heading. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

      {/* Minimal heading + subheading, bottom-left. */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-12 sm:px-6 md:px-10 md:pb-16">
        <Eyebrow className="mb-4 block text-white/80">Software Engineer &middot; Full-Stack Developer &middot; London</Eyebrow>
        <h1 className="font-display font-semibold tracking-[-0.035em] text-white text-[clamp(2.75rem,9vw,8rem)] leading-[0.88]">
          <RevealLines lines={["Victor Nabasu"]} mount />
        </h1>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-6 animate-bounce text-white/70">
        <ArrowDown className="h-5 w-5" />
      </div>
    </section>
  )
}
