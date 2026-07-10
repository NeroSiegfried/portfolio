import Image from "next/image"
import { services, type Service } from "@/lib/portfolio-data"
import { SectionHead } from "@/components/v2/primitives"
import { ScrollColorText } from "@/components/v2/scroll-color-text"

/** Wide media for a service row — the supplied image, or an on-brand placeholder. */
function ServiceMedia({ service, index }: { service: Service; index: number }) {
  const num = String(index + 1).padStart(2, "0")
  if (service.image) {
    return (
      <div className="v2-media relative aspect-[16/10] w-full self-stretch overflow-hidden border border-border md:my-6 md:aspect-auto">
        <Image
          src={service.image}
          alt={service.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 42vw"
          className="object-cover"
        />
      </div>
    )
  }
  return (
    <div
      className="v2-service-ph relative aspect-[16/10] w-full self-stretch overflow-hidden border border-border md:my-6 md:aspect-auto"
      role="img"
      aria-label={service.imageAlt}
    >
      <span className="v2-service-ph__num" aria-hidden>{num}</span>
      <span className="absolute left-4 top-3 inline-flex items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="text-primary">&#9670;</span> Reference image
      </span>
    </div>
  )
}

export function Services() {
  return (
    <section className="border-t border-border px-4 py-14 md:px-6 md:py-20">
      <SectionHead eyebrow="What I do" label="Services" title="How I can help" />

      {/* Scroll-filled intro (portfoliod): brightens as it scrolls into view. */}
      <div className="mt-8 md:mt-10 md:flex md:justify-end">
        <ScrollColorText className="max-w-2xl font-display text-xl leading-[1.35] tracking-tight md:text-2xl">
          {"From data model to deployed product, I design, build and ship software end-to-end — then write about how each piece is made."}
        </ScrollColorText>
      </div>

      {/* Portfoliod-style rows: title top-left, description bottom-left, wide image right. */}
      <div className="mt-12 md:mt-16">
        {services.map((service, i) => (
          <div
            key={service.title}
            className="group grid gap-5 border-t border-border py-8 last:border-b md:grid-cols-[1fr_minmax(0,42%)] md:gap-12 md:py-0 md:min-h-[19rem] md:last:border-b-0"
          >
            {/* Left column — title (top) + description (bottom) */}
            <div className="flex flex-col justify-between md:py-9">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-2xl font-semibold tracking-tight md:text-4xl">{service.title}</h3>
              </div>
              <p className="mt-6 max-w-sm font-mono text-sm leading-relaxed text-muted-foreground md:mt-0">
                {service.description}
              </p>
            </div>

            {/* Right column — wide image */}
            <ServiceMedia service={service} index={i} />
          </div>
        ))}
      </div>
    </section>
  )
}
