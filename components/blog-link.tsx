"use client"

import Link from "next/link"
import { useBlogSubdomain } from "@/lib/blog/subdomain-context"

/**
 * Converts an internal /blog/… path into the correct path for the current host.
 *
 * On blog.nerosiegfried.com:
 *   /blog           → /
 *   /blog/my-post   → /my-post
 *   /blog/series/x  → /series/x
 *
 * On www.nerosiegfried.com the path is returned unchanged.
 */
export function toBlogRelativePath(href: string): string {
  if (href === "/blog") return "/"
  if (href.startsWith("/blog/")) return href.slice(5) // "/blog/" is 6 chars → slice(5) gives "/"
  return href
}

interface BlogLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string
  children: React.ReactNode
  prefetch?: boolean
}

/**
 * Drop-in replacement for Next.js <Link> inside blog pages.
 * On the blog subdomain it strips the /blog prefix so URLs stay clean.
 */
export default function BlogLink({ href, children, prefetch, ...rest }: BlogLinkProps) {
  const isBlogSubdomain = useBlogSubdomain()
  const resolvedHref = isBlogSubdomain ? toBlogRelativePath(href) : href
  return (
    <Link href={resolvedHref} prefetch={prefetch} {...rest}>
      {children}
    </Link>
  )
}
