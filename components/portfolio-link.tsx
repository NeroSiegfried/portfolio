"use client"

import Link from "next/link"
import { useBlogSubdomain } from "@/lib/blog/subdomain-context"
import { useBasePath } from "@/lib/base-path"

interface PortfolioLinkProps {
  children: React.ReactNode
  className?: string
}

/**
 * A "← Portfolio" link that correctly navigates to the portfolio site
 * regardless of which domain/subdomain the user is currently on.
 *
 * On www.nerosiegfried.com    →  href="/"  (same origin)
 * On blog.nerosiegfried.com   →  strips the "blog." prefix dynamically
 *
 * Derives the apex domain from window.location.hostname at click time so
 * the link never breaks if the domain name changes.
 */
export default function PortfolioLink({ children, className }: PortfolioLinkProps) {
  const isBlogSubdomain = useBlogSubdomain()
  const basePath = useBasePath()

  if (isBlogSubdomain) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Only override the default href — actual navigation is handled by
      // the browser after we set the correct URL.
      const apex = window.location.hostname.replace(/^blog\./, "")
      const url = `${window.location.protocol}//${apex}`
      e.preventDefault()
      window.location.href = url
    }

    return (
      // The static href is a reasonable SSR fallback; it is overridden on click.
      <a href="/" className={className} onClick={handleClick}>
        {children}
      </a>
    )
  }

  return (
    <Link href={basePath || "/"} prefetch className={className}>
      {children}
    </Link>
  )
}
