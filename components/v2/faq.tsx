"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { faqs } from "@/lib/portfolio-data"
import { Eyebrow } from "@/components/v2/primitives"
import { cn } from "@/lib/utils"

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="border-t border-border px-4 py-14 md:px-6 md:py-20">
      {/* Two columns so the section fills the full width: sticky heading left, list right. */}
      <div className="grid gap-10 md:grid-cols-[minmax(260px,32%)_1fr] md:gap-16">
        <div className="md:sticky md:top-24 md:self-start">
          <Eyebrow className="mb-3 block">FAQ</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.05]">
            Frequently asked
          </h2>
          <p className="mt-5 max-w-xs font-mono text-sm leading-relaxed text-muted-foreground">
            Good to know before we start. Still curious?{" "}
            <a href="#contact" className="text-primary underline-offset-4 hover:underline">Get in touch</a>.
          </p>
        </div>

        <div className="border-t border-border md:border-t-0">
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className={cn("font-display text-lg font-medium tracking-tight transition-colors md:text-xl", isOpen && "text-primary")}>
                    {f.q}
                  </span>
                  <Plus className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-45 text-primary")} />
                </button>
                <div className="v2-accordion" data-open={isOpen}>
                  <div>
                    <p className="max-w-2xl pb-6 text-base leading-relaxed text-muted-foreground">{f.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
