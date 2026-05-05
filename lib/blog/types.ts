export type UserRole = "admin" | "user"

export interface BlogUser {
  id: string
  username: string
  email: string
  passwordHash: string
  role: UserRole
  createdAt: string
  blocked?: boolean
  displayName?: string | null
  avatarUrl?: string | null
}

export interface BlogSession {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
}

export interface BlogSeries {
  id: string
  slug: string
  title: string
  description: string
  type: string
  parentId: string | null
  themeClass: string | null
  /** Optional format string for entry labels. Use {n}, {roman}, {ROMAN}, {alpha}, {ALPHA}.
   *  Examples: "Project {n}", "Chapter {roman}", "Part {ROMAN}" */
  numberFormat?: string | null
  createdAt: string
  updatedAt: string
}

export type BlogPostStatus = "draft" | "published"

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  /** Optional per-post CSS injected into a <style> tag on the post page. */
  customCss?: string | null
  /** Series display order. 0 = unset (falls back to publishedAt). Higher numbers sort later. */
  position: number
  seriesId: string | null
  status: BlogPostStatus
  authorId: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface BlogSnippet {
  id: string
  slug: string
  title: string
  description: string
  html: string
  css: string
  js: string
  createdAt: string
  updatedAt: string
}

export interface BlogComment {
  id: string
  postId: string
  userId: string
  parentId: string | null
  content: string
  createdAt: string
  updatedAt: string
  editedAt?: string
  hidden?: boolean
}

export interface BlogCommentVote {
  id: string
  commentId: string
  userId: string
  value: -1 | 1
}

export interface BlogPostVote {
  id: string
  postId: string
  userId: string
  value: 1
}

export interface BlogDb {
  users: BlogUser[]
  sessions: BlogSession[]
  series: BlogSeries[]
  posts: BlogPost[]
  snippets: BlogSnippet[]
  comments: BlogComment[]
  commentVotes: BlogCommentVote[]
  postVotes: BlogPostVote[]
}

export interface PublicUser {
  id: string
  username: string
  role: UserRole
  displayName: string | null
  avatarUrl: string | null
}

export interface SeriesNode extends BlogSeries {
  children: SeriesNode[]
}

export interface CommentNode extends BlogComment {
  children: CommentNode[]
  username: string
  displayName: string | null
  avatarUrl: string | null
  score: number
  currentUserVote: 1 | -1 | 0
}

export interface AppNotification {
  id: string
  type: "series_post" | "comment_reply"
  read_at: string | null
  created_at: string
  post_id: string | null
  comment_id: string | null
  actor_id: string | null
  data: {
    actorName?: string
    actorAvatarUrl?: string | null
    postSlug?: string
    postTitle?: string
    seriesTitle?: string
    seriesId?: string
  }
}
