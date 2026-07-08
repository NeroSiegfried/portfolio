export default function BlogHomeLoading() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      {/* Top bar skeleton */}
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-6">
          <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse" />
        </div>
      </div>

      <main className="container mx-auto px-4 pb-20 pt-28 flex-1">
        {/* Page header */}
        <header className="mb-12">
          <div className="h-12 w-32 rounded-lg bg-muted/50 animate-pulse" />
          <div className="mt-3 h-4 w-64 rounded bg-muted/40 animate-pulse" />
        </header>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-16">
          {/* Sidebar skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-20 rounded bg-muted/40 animate-pulse" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 rounded bg-muted/30 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>

          {/* Post list skeleton */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border/40 p-5 space-y-3" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="h-6 w-3/4 rounded bg-muted/50 animate-pulse" />
                <div className="h-4 w-full rounded bg-muted/30 animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-muted/30 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
