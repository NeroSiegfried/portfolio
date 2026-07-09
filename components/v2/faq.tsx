"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { faqs } from "@/lib/portfolio-data"
import { SectionHead } from "@/components/v2/primitives"
import { cn } from "@/lib/utils"

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="border-t border-border px-5 py-16 md:px-8 md:py-24">
      <div className="w-full max-w-4xl">
        <SectionHead eyebrow="FAQ" label="Good to know" title="Frequently asked" />
        <div className="mt-6">
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
