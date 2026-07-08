import { cn } from "@/lib/utils"

/** Monospace uppercase micro-label (portfolie "eyebrow" pattern). */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground", className)}>
      {children}
    </span>
  )
}

/**
 * Editorial section header: eyebrow (top-left) + big display title, with an
 * optional right-aligned section label, separated by a hairline rule.
 */
export function SectionHead({
  eyebrow,
  label,
  title,
  className,
}: {
  eyebrow?: string
  label?: string
  title: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-end justify-between gap-6 border-b border-border pb-5", className)}>
      <div>
        {eyebrow ? <Eyebrow className="mb-3 block">{eyebrow}</Eyebrow> : null}
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.05]">
          {title}
        </h2>
      </div>
      {label ? <Eyebrow className="hidden shrink-0 pb-1 sm:block">{label}</Eyebrow> : null}
    </div>
  )
}
