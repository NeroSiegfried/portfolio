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
  const published = getPublishedPosts(db.posts)

  return published.map((post) => ({
    ...post,
    seriesPath: getSeriesPath(db.series, post.seriesId),
    upvotes: getPostScore(db.postVotes, post.id),
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

  const collect = (parentId: string) => {
    includeIds.add(parentId)
    db.series
      .filter((series) => series.parentId === parentId)
      .forEach((series) => collect(series.id))
  }

  collect(seriesId)

  return listPublishedPosts(db)
    .filter((post) => post.seriesId && includeIds.has(post.seriesId))
    .sort((a, b) => {
      const at = new Date(a.publishedAt ?? a.createdAt).getTime()
      const bt = new Date(b.publishedAt ?? b.createdAt).getTime()
      return at - bt  // ascending: oldest published = Project 1
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
