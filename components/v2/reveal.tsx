"use client"

import { motion, type HTMLMotionProps } from "framer-motion"

const EASE = [0.16, 1, 0.3, 1] as const

/** Fade + rise on scroll into view. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  mount = false,
  className,
  ...rest
}: { children: React.ReactNode; delay?: number; y?: number; mount?: boolean; className?: string } & HTMLMotionProps<"div">) {
  const trigger = mount
    ? { animate: { opacity: 1, y: 0 } }
    : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-8%" } as const }
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      {...trigger}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/**
 * Heading mask-reveal: text slides up from behind an overflow-hidden edge.
 * Pass plain string lines; each line animates with a stagger.
 */
export function RevealLines({ lines, className, mount = false }: { lines: string[]; className?: string; mount?: boolean }) {
  // Above-the-fold headings (e.g. the hero) must animate on MOUNT — whileInView
  // is unreliable for content already in view on first paint.
  const trigger = mount ? { animate: { y: 0 } } : { whileInView: { y: 0 }, viewport: { once: true } as const }
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            {...trigger}
            transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
