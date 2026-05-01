import { headers } from "next/headers"
import { BlogSubdomainProvider } from "@/lib/blog/subdomain-context"

/**
 * Layout for all /blog routes. Reads the Host header server-side and
 * injects a context value so every client component in the blog can know
 * whether it's running on the blog subdomain without extra client round-trips.
 */
export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const host = headersList.get("host")?.split(":")[0].toLowerCase() ?? ""
  const isBlogSubdomain = host.startsWith("blog.")

  return (
    <BlogSubdomainProvider isBlogSubdomain={isBlogSubdomain}>
      {children}
    </BlogSubdomainProvider>
  )
}
