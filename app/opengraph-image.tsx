import { ImageResponse } from "next/og"
import { OG_SIZE, fetchImageDataUrl, OgCard } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "Victor Nabasu — Software Engineer & Full-Stack Developer"
export const size = OG_SIZE
export const contentType = "image/png"

export default async function OGImage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nerosiegfried.com"
  const imageSrc = await fetchImageDataUrl(`${siteUrl}/hero/hero-2.jpg`)

  return new ImageResponse(
    OgCard({
      imageSrc,
      label: "PORTFOLIO",
      eyebrow: "Software Engineer · Full-Stack Developer · London",
      title: "Victor Nabasu",
      titleSize: 82,
      subtitle: "I design, build and ship software end-to-end — then write about how each piece is made.",
    }),
    OG_SIZE
  )
}
