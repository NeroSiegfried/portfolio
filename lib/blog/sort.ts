/**
 * Client-safe comment sorting utilities.
 * Must NOT import from store.ts (which pulls in pg / Node.js builtins).
 */
import type { CommentNode } from "@/lib/blog/types"

export type CommentSortOrder = "top" | "newest" | "oldest"

/** Re-sort an already-built comment tree at every level without mutating. */
export function sortCommentTree(nodes: CommentNode[], order: CommentSortOrder): CommentNode[] {
  const sorted = [...nodes].sort((a, b) => {
    if (order === "top") {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return order === "newest" ? tb - ta : ta - tb
  })
  return sorted.map((node) => ({
    ...node,
    children: sortCommentTree(node.children, order),
  }))
}
