"use client"

import { createContext, useContext } from "react"

/**
 * True when the current page is being served from the blog subdomain
 * (e.g. blog.nerosiegfried.com). Provided by the blog layout server component
 * which reads the Host header, so it's available to all client components
 * inside the blog section without an extra round-trip.
 */
export const SubdomainContext = createContext<boolean>(false)

export function useBlogSubdomain() {
  return useContext(SubdomainContext)
}

export function BlogSubdomainProvider({
  children,
  isBlogSubdomain,
}: {
  children: React.ReactNode
  isBlogSubdomain: boolean
}) {
  return (
    <SubdomainContext.Provider value={isBlogSubdomain}>
      {children}
    </SubdomainContext.Provider>
  )
}
