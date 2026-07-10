"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

/**
 * Full-bleed hero slideshow. Cross-fades through `images` on a fixed interval
 * (default 5s). Adding more paths to the list simply extends the rotation — no
 * other change needed. Respects reduced-motion (holds on the first image).
 */
export function HeroBackdrop({ images, intervalMs = 5000 }: { images: string[]; intervalMs?: number }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(() => setActive((a) => (a + 1) % images.length), intervalMs)
    return () => clearInterval(id)
  }, [images.length, intervalMs])

  return (
    <div className="absolute inset-0 bg-secondary">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className={cn(
            "object-cover transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none",
            i === active ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  )
}
