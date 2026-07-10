/**
 * v2 loading skeletons for the blog. These match the real reado-style layout —
 * the fixed framed nav, the `mx-4 border-x` content column, squared (never
 * rounded) blocks — so that on the rare cache miss the loading state reads as
 * the same page settling in, not a different site. Pure server components (no
 * client hooks) so they're safe as Suspense fallbacks.
 */

const pulse = "bg-muted/60 animate-pulse"

/** Static stand-in for <BlogNav>: same fixed frame, back-arrow, wordmark, controls. */
export function BlogNavSkeleton() {
  return (
    <header className="fixed inset-x-4 top-4 z-50 border border-border bg-card md:inset-x-6" aria-hidden>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 md:px-6 md:py-[0.9rem]">
        <div className={`h-3.5 w-24 justify-self-start ${pulse}`} />
        <div className={`h-4 w-20 justify-self-center ${pulse}`} />
        <div className="flex items-center justify-self-end gap-2 sm:gap-2.5">
          <div className={`h-9 w-9 ${pulse}`} />
          <div className={`hidden h-9 w-9 sm:block ${pulse}`} />
          <div className={`h-9 w-9 ${pulse}`} />
          <div className={`hidden h-9 w-24 sm:block ${pulse}`} />
        </div>
      </div>
    </header>
  )
}

/** One image-led card placeholder (border box → cover → title/meta lines). */
function CardSkeleton() {
  return (
    <div className="flex flex-col border border-border bg-card/30" aria-hidden>
      <div className={`aspect-[4/3] ${pulse}`} />
      <div className="flex flex-col gap-3 p-5">
        <div className={`h-6 w-4/5 ${pulse}`} />
        <div className={`h-3.5 w-full ${pulse}`} />
        <div className={`h-3.5 w-2/3 ${pulse}`} />
        <div className="mt-2 flex items-center justify-between">
          <div className={`h-3 w-20 ${pulse}`} />
          <div className={`h-3 w-12 ${pulse}`} />
        </div>
      </div>
    </div>
  )
}

/** /blog index loading state — masthead → category bar → hero → card grid. */
export function BlogIndexSkeleton() {
  return (
    <>
      <BlogNavSkeleton />
      <div className="relative bg-background">
        <div className="mx-4 border-x border-border md:mx-6">
          {/* Masthead wordmark */}
          <div className="px-4 pt-28 md:px-6 md:pt-36">
            <div className={`h-16 w-2/3 md:h-28 lg:h-36 ${pulse}`} />
            <div className={`mt-6 h-4 w-72 max-w-full ${pulse}`} />
          </div>

          {/* Inverted category bar */}
          <div className="mt-10 bg-foreground/90 px-4 py-4 md:px-6">
            <div className="flex flex-wrap gap-6">
              {["w-24", "w-20", "w-28", "w-16", "w-24"].map((w, i) => (
                <div key={i} className={`h-3.5 ${w} bg-background/30 animate-pulse`} />
              ))}
            </div>
          </div>

          {/* Editorial hero: serif tagline (left) + featured card (right) */}
          <div className="grid gap-8 px-4 py-14 md:grid-cols-2 md:px-6 md:py-20">
            <div className="flex flex-col justify-center gap-4">
              <div className={`h-3 w-24 ${pulse}`} />
              <div className={`h-9 w-full ${pulse}`} />
              <div className={`h-9 w-11/12 ${pulse}`} />
              <div className={`h-9 w-3/4 ${pulse}`} />
            </div>
            <div className="flex flex-col border border-border bg-card/30">
              <div className={`aspect-[16/10] ${pulse}`} />
              <div className="flex flex-col gap-3 p-6">
                <div className={`h-7 w-3/4 ${pulse}`} />
                <div className={`h-4 w-full ${pulse}`} />
                <div className={`h-4 w-1/2 ${pulse}`} />
              </div>
            </div>
          </div>

          {/* Card grid */}
          <div className="grid gap-6 px-4 pb-20 md:grid-cols-2 md:px-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/** /blog/[slug] loading state — breadcrumb → serif header → 2-col body. */
export function BlogPostSkeleton() {
  return (
    <>
      <BlogNavSkeleton />
      <div className="relative bg-background">
        <div className="mx-4 border-x border-border md:mx-6">
          {/* Breadcrumb + top pager */}
          <div className="px-4 pt-28 md:px-6 md:pt-32">
            <div className={`h-3 w-40 ${pulse}`} />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className={`h-16 border border-border ${pulse}`} />
              <div className={`hidden h-16 border border-border sm:block ${pulse}`} />
            </div>
          </div>

          {/* Header */}
          <div className="px-4 pt-10 md:px-6">
            <div className="max-w-4xl">
              <div className="flex items-center gap-4">
                <div className={`h-3 w-24 ${pulse}`} />
                <div className={`h-3 w-28 ${pulse}`} />
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <div className={`h-11 w-full ${pulse}`} />
                <div className={`h-11 w-2/3 ${pulse}`} />
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <div className={`h-4 w-full max-w-3xl ${pulse}`} />
                <div className={`h-4 w-4/5 max-w-3xl ${pulse}`} />
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <div className={`h-10 w-28 border border-border ${pulse}`} />
                <div className={`h-10 w-52 border border-border ${pulse}`} />
              </div>
            </div>
          </div>

          {/* Body: reading column + sticky sidebar */}
          <div className="px-4 py-12 md:px-6 md:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12 xl:gap-16">
              <div className="flex max-w-3xl flex-col gap-4">
                {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-3/4"].map((w, i) => (
                  <div key={i} className={`h-4 ${w} ${pulse}`} />
                ))}
                <div className={`my-6 aspect-[16/9] w-full border border-border ${pulse}`} />
                {["w-full", "w-5/6", "w-full", "w-2/3"].map((w, i) => (
                  <div key={i} className={`h-4 ${w} ${pulse}`} />
                ))}
              </div>
              <div className="hidden lg:block">
                <div className="flex flex-col gap-3 border border-border p-5">
                  <div className={`h-3 w-24 ${pulse}`} />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-4 w-full ${pulse}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
