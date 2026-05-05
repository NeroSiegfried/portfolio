import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BLOG_HOSTNAME = "blog.nerosiegfried.com"
const MAIN_ORIGIN = "https://nerosiegfried.com"

function normalize(path: string) {
  if (!path) return "/control"
  return path.startsWith("/") ? path : `/${path}`
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() ?? ""
  const pathname = request.nextUrl.pathname

  // Redirect blog subdomain → main domain /blog/ path.
  // Using a hard redirect (not a rewrite) keeps everything on one origin so that
  // session cookies, OAuth callback URLs, and API routes all work consistently.
  if (host === BLOG_HOSTNAME) {
    // Preserve _next assets and API calls during any brief redirect race
    if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
      return NextResponse.next()
    }
    // Already has /blog prefix → redirect to same path on main domain
    if (pathname.startsWith("/blog")) {
      return NextResponse.redirect(`${MAIN_ORIGIN}${pathname}`, 301)
    }
    // Root or any clean path → prefix with /blog
    const blogPath = pathname === "/" ? "/blog" : `/blog${pathname}`
    return NextResponse.redirect(`${MAIN_ORIGIN}${blogPath}`, 301)
  }

  const configuredEntry = normalize(process.env.ADMIN_ENTRY_PATH ?? "/control")

  if (configuredEntry === "/control") {
    return NextResponse.next()
  }

  if (request.nextUrl.pathname === configuredEntry) {
    const target = new URL("/control", request.url)
    return NextResponse.rewrite(target)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
}
