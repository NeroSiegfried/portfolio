import type React from "react"
import type { Metadata } from "next"
import { Inter, Inter_Tight, Nanum_Myeongjo, Geist_Mono, Great_Vibes } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PageTransition } from "@/components/v2/page-transition"

// Body sans (unchanged from v1). Display + serif + mono added for v2.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })
// Oversized, tight display headings (portfolie's "Inter Display" analogue).
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-display", display: "swap" })
// Serif for blog article/section titles (reado / narrate analogue).
const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-serif",
  display: "swap",
})
// Monospace eyebrow / micro labels.
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" })
// Elegant cursive signature (footer wordmark).
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: ["400"], variable: "--font-script", display: "swap" })

const fontVars = `${inter.variable} ${interTight.variable} ${nanumMyeongjo.variable} ${geistMono.variable} ${greatVibes.variable}`

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nerosiegfried.com"

export const metadata: Metadata = {
  title: {
    default: "Victor Nabasu — Full Stack Developer & Engineer",
    template: "%s | Victor Nabasu",
  },
  description:
    "Portfolio of Victor Nabasu — MSc Advanced Software Engineering at King's College London. Building software with Python, C, TypeScript, and more.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    siteName: "Victor Nabasu",
    title: "Victor Nabasu — Full Stack Developer & Engineer",
    description:
      "Portfolio of Victor Nabasu — MSc Advanced Software Engineering at King's College London. Building software with Python, C, TypeScript, and more.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Victor Nabasu — Full Stack Developer & Engineer",
    description:
      "Portfolio of Victor Nabasu — MSc Advanced Software Engineering at King's College London.",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVars} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {/* Persistent (mounted once, survives navigation) so it can drive the
              cover→reveal page transition across routes. */}
          <PageTransition />
        </ThemeProvider>
      </body>
    </html>
  )
}
