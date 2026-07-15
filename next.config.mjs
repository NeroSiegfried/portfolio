/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://challenges.cloudflare.com", // unsafe-eval needed by Next.js dev; tighten in prod
      "style-src 'self' 'unsafe-inline' https://vercel.live",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://vercel.live",
      "connect-src 'self' https://nerosiegfried.com https://www.nerosiegfried.com https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com https://d2ukq6p6guyuw1.cloudfront.net https://vercel.live https://*.pusher.com wss://*.pusher.com https://challenges.cloudflare.com",
      "frame-src 'self' https://vercel.live https://challenges.cloudflare.com",
      "frame-ancestors 'self'",
    ].join("; "),
  },
]

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
