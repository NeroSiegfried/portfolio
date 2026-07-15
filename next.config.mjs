/** @type {import('next').NextConfig} */

const isDevelopment = process.env.NODE_ENV === "development"
const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  "https://vercel.live",
  "https://challenges.cloudflare.com",
].join(" ")

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // vercel.live = the Vercel preview feedback/comments widget (preview deploys only).
      // challenges.cloudflare.com = Cloudflare Turnstile (contact + newsletter spam check).
      `script-src ${scriptSources}`,
      "style-src 'self' 'unsafe-inline' https://vercel.live",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://vercel.live",
      "connect-src 'self' https://nerosiegfried.com https://www.nerosiegfried.com https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com https://d2ukq6p6guyuw1.cloudfront.net https://vercel.live https://*.pusher.com wss://*.pusher.com https://challenges.cloudflare.com",
      "frame-src 'self' https://vercel.live https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ].join("; "),
  },
]

const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: false,
    // Keep the 5,000px source hero available to high-density 4K displays.
    // The intermediate 2,560px width also avoids jumping straight from 2,048
    // to 3,840px for the three-column blog grid.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840, 5000],
    remotePatterns: [
      { protocol: "https", hostname: "nerosiegfried.com" },
      { protocol: "https", hostname: "www.nerosiegfried.com" },
      { protocol: "https", hostname: "blog.nerosiegfried.com" },
      { protocol: "https", hostname: "d2ukq6p6guyuw1.cloudfront.net" },
      { protocol: "https", hostname: "du86d70bfiu40.cloudfront.net" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.us-east-1.amazonaws.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
  async redirects() {
    return []
  },
}

export default nextConfig
