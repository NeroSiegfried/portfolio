import type { Metadata } from "next"
import { BasePathProvider } from "@/lib/base-path"

/**
 * /v1 — preserved "v1" backup of the original site design.
 *
 * The entire subtree is mounted at basePath "/v1": every internal link that
 * flows through BlogLink / PortfolioLink / the portfolio sections is prefixed
 * with /v1 automatically (see lib/base-path.tsx), so v1 navigation never leaks
 * back into the live (redesigned) site. API routes stay un-namespaced and shared.
 *
 * The `.v1-scope` wrapper is the CSS seam: once the redesign diverges the design
 * tokens in globals.css, the frozen v1 palette/typography is pinned under this
 * class so v1 keeps rendering exactly as it does today (see docs/redesign/LOG.md).
 *
 * noindex: the backup must not compete with the live site for search results.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function V1Layout({ children }: { children: React.ReactNode }) {
  return (
    <BasePathProvider base="/v1">
      <div className="v1-scope">{children}</div>
    </BasePathProvider>
  )
}
