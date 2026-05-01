export default function BlogPostLoading() {
  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden bg-background">
      {/* Top bar skeleton */}
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-6">
          <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse" />
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20 pt-28 flex-1">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb skeleton */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-4 w-10 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-2 rounded bg-muted/30 animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted/40 animate-pulse" />
          </div>

          {/* Article header skeleton */}
          <div className="mb-8 border-b border-border/40 pb-8 space-y-4">
            <div className="h-10 w-4/5 rounded-lg bg-muted/50 animate-pulse" />
            <div className="h-5 w-2/3 rounded bg-muted/30 animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 rounded bg-muted/30 animate-pulse" />
              <div className="h-8 w-20 rounded-full bg-muted/30 animate-pulse" />
            </div>
          </div>

          {/* Article body skeleton */}
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 rounded bg-muted/30 animate-pulse" style={{
                width: `${[100, 95, 88, 100, 92, 85, 96, 70][i % 8]}%`,
                animationDelay: `${i * 40}ms`,
              }} />
            ))}
            <div className="my-8 h-48 rounded-xl bg-muted/20 animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i + 8} className="h-4 rounded bg-muted/30 animate-pulse" style={{
                width: `${[100, 90, 95, 82, 100, 75][i % 6]}%`,
                animationDelay: `${(i + 8) * 40}ms`,
              }} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
