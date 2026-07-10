import { BlogPostSkeleton } from "@/components/v2/blog/blog-skeleton"

// Article loading state — mirrors the 2-column post layout (framed column,
// serif header, sticky sidebar) so it matches the real page, not the old site.
export default function BlogPostLoading() {
  return <BlogPostSkeleton />
}
