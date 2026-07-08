"use client"

import { createContext, useContext, type ReactNode } from "react"

/**
 * Route base path for the current subtree.
 *   ""     → the live site mounted at the domain root
 *   "/v1"  → the preserved "v1" backup mounted under /v1
 *
 * Link/navigation components read this and prepend it to internal hrefs so a
 * single component renders correctly under either mount point — no duplication.
 * Default is "" so components used outside any provider behave exactly as before.
 */
export const BasePathContext = createContext<string>("")

export function useBasePath(): string {
  return useContext(BasePathContext)
}

/** Prepend `base` to an internal path. Leaves the path unchanged when base is "". */
export function withBase(base: string, href: string): string {
  if (!base) return href
  if (href === "/") return base
  if (href.startsWith("/")) return `${base}${href}`
  return href // external / hash / relative — leave untouched
}

export function BasePathProvider({
  base,
  children,
}: {
  base: string
  children: ReactNode
}) {
  return <BasePathContext.Provider value={base}>{children}</BasePathContext.Provider>
}
