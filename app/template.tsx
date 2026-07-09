"use client"

import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

/**
 * Page transition (portfolie/reado): on each navigation an accent panel covers
 * the viewport then wipes away top→bottom, revealing the new page while its
 * sections rise into place (see `Reveal`). The wipe is its OWN fixed layer — the
 * page content is NOT wrapped in a transform, so `fixed`/`sticky` nav + cursor
 * keep working. Skipped on the frozen /v1 site and the admin dashboard.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const skip =
    pathname === "/v1" || pathname?.startsWith("/v1/") ||
    pathname === "/control" || pathname?.startsWith("/control/")

  if (skip) return <>{children}</>

  return (
    <>
      <motion.div
        aria-hidden
        className="v2-page-wipe"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0 }}
        transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
      />
      {children}
    </>
  )
}
