import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const BLOG_HOSTNAME = "blog.nerosiegfried.com"

function normalize(path: string) {
  if (!path) return "/control"
  return path.startsWith("/") ? path : `/${path}`
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0].toLowerCase() ?? ""
  const pathname = request.nextUrl.pathname

  if (host === BLOG_HOSTNAME) {
    const isSystemPath =
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/control")

    if (!isSystemPath) {
      // If a link accidentally includes the /blog prefix on the subdomain,
      // redirect to the clean URL so the address bar always looks right.
      if (pathname === "/blog") {
        return NextResponse.redirect(new URL("/", request.url))
      }
      if (pathname.startsWith("/blog/")) {
        return NextResponse.redirect(new URL(pathname.slice(5), request.url))
      }

      // Rewrite clean subdomain paths → Next.js /blog/* file-system routes.
      if (pathname === "/") {
        return NextResponse.rewrite(new URL("/blog", request.url))
      }

      if (!pathname.startsWith("/blog")) {
        return NextResponse.rewrite(new URL(`/blog${pathname}`, request.url))
      }
    }
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
