import { ImageResponse } from "next/og"
import { OG_SIZE, fetchImageDataUrl, OgCard } from "@/lib/og-card"

export const runtime = "nodejs"
export const alt = "The Blog — Victor Nabasu"
export const size = OG_SIZE
export const contentType = "image/png"

export default async function OGImage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nerosiegfried.com"
  const imageSrc = await fetchImageDataUrl(`${siteUrl}/hero/hero-2.jpg`)

  return new ImageResponse(
    OgCard({
      imageSrc,
      label: "BLOG",
      eyebrow: "Dev logs · Structured series · Interactive articles",
      title: "The Blog.",
      titleSize: 92,
      subtitle: "Notes on building software — from data model to deployed product.",
      footer: "Written by Victor Nabasu",
    }),
    OG_SIZE
  )
}
