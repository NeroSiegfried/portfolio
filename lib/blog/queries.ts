import type { BlogDb, BlogPost, BlogSeries, CommentNode, PublicUser } from "@/lib/blog/types"
import {
  getCommentTree,
  getPostScore,
  getPublishedPosts,
  getSeriesBySlugPath,
  getSeriesPath,
  getSeriesTree,
} from "@/lib/blog/store"

export interface BlogPostSummary extends BlogPost {
  seriesPath: BlogSeries[]
  upvotes: number
}

export interface BlogPostDetail extends BlogPostSummary {
  comments: CommentNode[]
}

export function listPublishedPosts(db: BlogDb): BlogPostSummary[] {
  const seriesById = new Map(db.series.map((series) => [series.id, series]))
  const scoresByPostId = new Map<string, number>()
  for (const vote of db.postVotes) {
    scoresByPostId.set(vote.postId, (scoresByPostId.get(vote.postId) ?? 0) + vote.value)
  }

  const seriesPath = (seriesId: string | null) => {
    const path: BlogSeries[] = []
    let series = seriesId ? seriesById.get(seriesId) ?? null : null
    while (series) {
      path.unshift(series)
      series = series.parentId ? seriesById.get(series.parentId) ?? null : null
    }
    return path
  }

  return getPublishedPosts(db.posts).map((post) => ({
    ...post,
    seriesPath: seriesPath(post.seriesId),
    upvotes: scoresByPostId.get(post.id) ?? 0,
  }))
}

export function listSeriesTree(db: BlogDb) {
  return getSeriesTree(db.series)
}

export function findPublishedPostBySlug(db: BlogDb, slug: string): BlogPostDetail | null {
  const post = db.posts.find((entry) => entry.slug === slug && entry.status === "published")
  if (!post) return null

  const comments = db.comments.filter((entry) => entry.postId === post.id)

  return {
    ...post,
    seriesPath: getSeriesPath(db.series, post.seriesId),
    upvotes: getPostScore(db.postVotes, post.id),
    comments: getCommentTree(comments, db.users, db.commentVotes),
  }
}

export function findSeriesByPath(db: BlogDb, slugPath: string[]) {
  return getSeriesBySlugPath(db.series, slugPath)
}

export function listPublishedPostsForSeries(db: BlogDb, seriesId: string): BlogPostSummary[] {
  const includeIds = new Set<string>()
  const childrenByParentId = new Map<string, string[]>()
  for (const series of db.series) {
    if (!series.parentId) continue
    const children = childrenByParentId.get(series.parentId) ?? []
    children.push(series.id)
    childrenByParentId.set(series.parentId, children)
  }

  const pending = [seriesId]
  while (pending.length) {
    const id = pending.pop()!
    if (includeIds.has(id)) continue
    includeIds.add(id)
    pending.push(...(childrenByParentId.get(id) ?? []))
  }

  return listPublishedPosts(db)
    .filter((post) => post.seriesId && includeIds.has(post.seriesId))
    .sort((a, b) => {
      // Explicit position wins (1-based; 0 = unset)
      const ap = a.position ?? 0
      const bp = b.position ?? 0
      if (ap !== 0 || bp !== 0) {
        if (ap !== 0 && bp !== 0) return ap - bp
        if (ap !== 0) return -1
        return 1
      }
      // Fallback: ascending by publishedAt ?? createdAt
      const at = new Date(a.publishedAt ?? a.createdAt).getTime()
      const bt = new Date(b.publishedAt ?? b.createdAt).getTime()
      if (at !== bt) return at - bt
      const ac = new Date(a.createdAt).getTime()
      const bc = new Date(b.createdAt).getTime()
      if (ac !== bc) return ac - bc
      return a.id.localeCompare(b.id)
    })
}

export function listSnippetsBySlug(db: BlogDb) {
  return new Map(db.snippets.map((snippet) => [snippet.slug, snippet]))
}

export function listPostsChronological(db: BlogDb): BlogPostSummary[] {
  return listPublishedPosts(db).sort((a, b) => {
    const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return bDate - aDate
  })
}

export function isAdmin(user: PublicUser | null) {
  return user?.role === "admin"
}
