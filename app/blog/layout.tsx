import { BlogSubdomainProvider } from "@/lib/blog/subdomain-context"

/**
 * Layout for all /blog routes.
 * The blog subdomain (blog.nerosiegfried.com) now permanently redirects to
 * nerosiegfried.com/blog/, so isBlogSubdomain is always false.
 * Removing the headers() call here lets Next.js statically render all /blog
 * pages with ISR (revalidate=60) instead of forcing dynamic rendering.
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <BlogSubdomainProvider isBlogSubdomain={false}>
      {children}
    </BlogSubdomainProvider>
  )
}
