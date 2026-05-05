import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

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
    images: [
      {
        url: "/victor-nabasu.jpg",
        width: 1200,
        height: 630,
        alt: "Victor Nabasu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Victor Nabasu — Full Stack Developer & Engineer",
    description:
      "Portfolio of Victor Nabasu — MSc Advanced Software Engineering at King's College London.",
    images: ["/victor-nabasu.jpg"],
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
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
