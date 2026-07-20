import Link from "next/link"
import { AnimatedArrow } from "@/components/v2/animated-arrow"
import { Wordmark } from "@/components/v2/blog/wordmark"
import { Cursor } from "@/components/v2/cursor"
import { Footer } from "@/components/v2/footer"
import { HoverSlide } from "@/components/v2/hover-slide"
import { Eyebrow } from "@/components/v2/primitives"
import { SiteNav } from "@/components/v2/site-nav"

export default function NotFound() {
  return (
    <>
      <Cursor />
      <SiteNav homeLinks />
      <main className="pt-24 md:pt-28">
        <div className="mx-4 border-x border-border md:mx-6">
          <section id="top" className="flex min-h-[calc(100svh-6rem)] flex-col border-t border-border">
            <div className="flex items-center justify-between border-b border-border px-4 py-4 md:px-6">
              <Eyebrow>Error index</Eyebrow>
              <Eyebrow>Page unavailable</Eyebrow>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12 text-center sm:gap-10 sm:px-6 sm:py-16">
              <div className="w-full max-w-6xl">
                <Wordmark text="404" />
              </div>

              <div className="flex flex-col items-center">
                <Eyebrow className="mb-5 block">Wrong route</Eyebrow>
                <h1 className="max-w-3xl font-display text-[clamp(2.75rem,7vw,5.75rem)] font-semibold leading-[0.92] tracking-[-0.045em]">
                  This page isn&rsquo;t here.
                </h1>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                  It may have moved, been renamed, or never existed. The rest of the site is still within reach.
                </p>

                <div className="mt-9 flex w-full max-w-md flex-col justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row">
                  <Link href="/" className="group inline-flex items-center justify-center gap-3 bg-primary px-5 py-3.5 font-mono text-xs uppercase tracking-[0.14em] text-primary-foreground">
                    <HoverSlide>Back to home</HoverSlide>
                    <AnimatedArrow direction="left" />
                  </Link>
                  <Link href="/blog" className="group inline-flex items-center justify-center gap-3 border border-border px-5 py-3.5 font-mono text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary">
                    <HoverSlide>Read the blog</HoverSlide>
                    <AnimatedArrow />
                  </Link>
                </div>
              </div>
            </div>
          </section>
          <Footer />
        </div>
      </main>
    </>
  )
}
