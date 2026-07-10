import { BlogIndexSkeleton } from "@/components/v2/blog/blog-skeleton"

// Fallback for /blog and any child route without its own loading state
// (features, series). Matches the reado-style framed index so the wipe reveals
// a page that already looks like the blog settling in.
export default function BlogHomeLoading() {
  return <BlogIndexSkeleton />
}
