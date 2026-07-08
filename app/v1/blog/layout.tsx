import { BlogSubdomainProvider } from "@/lib/blog/subdomain-context"

/**
 * Layout for /v1/blog routes — mirrors app/blog/layout.tsx.
 * basePath ("/v1") is provided by the parent app/v1/layout.tsx, so all
 * BlogLink / PortfolioLink hrefs inside here resolve to /v1/blog/*.
 */
export default function V1BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <BlogSubdomainProvider isBlogSubdomain={false}>
      {children}
    </BlogSubdomainProvider>
  )
}
