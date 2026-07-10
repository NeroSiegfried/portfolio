import { randomUUID } from "crypto"
import { unstable_cache, revalidateTag } from "next/cache"
import { Pool } from "pg"
import type {
  BlogComment,
  BlogCommentVote,
  BlogDb,
  BlogPost,
  BlogPostVote,
  BlogSeries,
  BlogSession,
  BlogSnippet,
  BlogUser,
  CommentNode,
  SeriesNode,
} from "@/lib/blog/types"

// ─── Connection Pool ──────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

export function getPool(): Pool {
  if (!global._pgPool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not set")

    // RDS requires SSL, but standard EC2 PostgreSQL setup doesn't have it by default.
    // We only enable SSL if it's an RDS endpoint or if explicitly requested.
    const useSsl = url.includes("rds.amazonaws.com") || url.includes("sslmode=require")

    global._pgPool = new Pool({
      connectionString: url,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      max: 2,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    })
  }
  return global._pgPool
}

// ─── Row → Domain mappers ─────────────────────────────────────────────────────

function rowToUser(r: Record<string, unknown>): BlogUser {
  return {
    id: r.id as string,
    username: r.username as string,
    email: r.email as string,
    passwordHash: r.password_hash as string,
    role: r.role as "admin" | "user",
    createdAt: (r.created_at as Date).toISOString(),
    blocked: (r.blocked as boolean) ?? false,
    displayName: (r.display_name as string) ?? null,
    avatarUrl: (r.avatar_url as string) ?? null,
  }
}

function rowToSession(r: Record<string, unknown>): BlogSession {
  return {
    token: r.token as string,
    userId: r.user_id as string,
    createdAt: (r.created_at as Date).toISOString(),
    expiresAt: (r.expires_at as Date).toISOString(),
  }
}

function rowToSeries(r: Record<string, unknown>): BlogSeries {
  return {
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    description: (r.description as string) ?? "",
    type: (r.type as string) ?? "general",
    parentId: (r.parent_id as string) ?? null,
    themeClass: (r.theme_class as string) ?? null,
    numberFormat: (r.number_format as string) ?? null,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  }
}

function rowToPost(r: Record<string, unknown>): BlogPost {
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    excerpt: (r.excerpt as string) ?? "",
    content: (r.content as string) ?? "",
    coverImage: (r.cover_image as string) ?? null,
    seriesId: (r.series_id as string) ?? null,
    status: r.status as "draft" | "published",
    authorId: r.author_id as string,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
    publishedAt: r.published_at ? (r.published_at as Date).toISOString() : null,
    customCss: (r.custom_css as string) ?? null,
    position: (r.position as number) ?? 0,
  }
}

function rowToSnippet(r: Record<string, unknown>): BlogSnippet {
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    description: (r.description as string) ?? "",
    html: (r.html as string) ?? "",
    css: (r.css as string) ?? "",
    js: (r.js as string) ?? "",
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  }
}

function rowToComment(r: Record<string, unknown>): BlogComment {
  return {
    id: r.id as string,
    postId: r.post_id as string,
    userId: r.user_id as string,
    parentId: (r.parent_id as string) ?? null,
    content: r.content as string,
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
    editedAt: r.edited_at ? (r.edited_at as Date).toISOString() : undefined,
    hidden: (r.hidden as boolean) ?? false,
  }
}

function rowToCommentVote(r: Record<string, unknown>): BlogCommentVote {
  return {
    id: r.id as string,
    commentId: r.comment_id as string,
    userId: r.user_id as string,
    value: r.value as -1 | 1,
  }
}

function rowToPostVote(r: Record<string, unknown>): BlogPostVote {
  return {
    id: r.id as string,
    postId: r.post_id as string,
    userId: r.user_id as string,
    value: 1,
  }
}

// ─── readDb / updateDb ────────────────────────────────────────────────────────

export async function readDb(): Promise<BlogDb> {
  const pool = getPool()
  const [users, sessions, series, posts, snippets, comments, commentVotes, postVotes] =
    await Promise.all([
      pool.query("SELECT * FROM users"),
      pool.query("SELECT * FROM sessions WHERE expires_at > NOW()"),
      pool.query("SELECT * FROM series ORDER BY title"),
      pool.query("SELECT * FROM posts ORDER BY updated_at DESC"),
      pool.query("SELECT * FROM snippets ORDER BY created_at DESC"),
      pool.query("SELECT * FROM comments ORDER BY created_at ASC"),
      pool.query("SELECT * FROM comment_votes"),
      pool.query("SELECT * FROM post_votes"),
    ])

  return {
    users: users.rows.map(rowToUser),
    sessions: sessions.rows.map(rowToSession),
    series: series.rows.map(rowToSeries),
    posts: posts.rows.map(rowToPost),
    snippets: snippets.rows.map(rowToSnippet),
    comments: comments.rows.map(rowToComment),
    commentVotes: commentVotes.rows.map(rowToCommentVote),
    postVotes: postVotes.rows.map(rowToPostVote),
  }
}

// Aggressive: the DB is hit at most once an hour per cache key. Content edits
// don't wait for this — every write goes through updateDb, which calls
// revalidateTag("blog-data") to bust all four caches immediately. The TTL is
// only a safety-net backstop (e.g. for vote-count drift, which isn't tagged).
const CACHE_TTL = 3600 // seconds

export const readBlogHomeDb = unstable_cache(
  async (): Promise<BlogDb> => {
    const pool = getPool()
    const [series, posts, postVotes] = await Promise.all([
      pool.query("SELECT * FROM series ORDER BY title"),
      pool.query(
        `SELECT id, slug, title, excerpt, cover_image, series_id, status, author_id,
                published_at, created_at, updated_at, NULL::text AS content, NULL::text AS custom_css
         FROM posts WHERE status='published' ORDER BY COALESCE(published_at, created_at) DESC`
      ),
      pool.query("SELECT * FROM post_votes"),
    ])
    return {
      users: [],
      sessions: [],
      series: series.rows.map(rowToSeries),
      posts: posts.rows.map(rowToPost),
      snippets: [],
      comments: [],
      commentVotes: [],
      postVotes: postVotes.rows.map(rowToPostVote),
    }
  },
  ["blog-home"],
  { revalidate: CACHE_TTL, tags: ["blog-home", "blog-data"] }
)

export const readSeriesDb = unstable_cache(
  async (): Promise<BlogDb> => {
    const pool = getPool()
    const [series, posts, postVotes] = await Promise.all([
      pool.query("SELECT * FROM series ORDER BY title"),
      pool.query(
        `SELECT id, slug, title, excerpt, cover_image, series_id, status, author_id,
                published_at, created_at, updated_at, NULL::text AS content, NULL::text AS custom_css
         FROM posts WHERE status='published' ORDER BY COALESCE(published_at, created_at) DESC`
      ),
      pool.query("SELECT * FROM post_votes"),
    ])
    return {
      users: [],
      sessions: [],
      series: series.rows.map(rowToSeries),
      posts: posts.rows.map(rowToPost),
      snippets: [],
      comments: [],
      commentVotes: [],
      postVotes: postVotes.rows.map(rowToPostVote),
    }
  },
  ["blog-series"],
  { revalidate: CACHE_TTL, tags: ["blog-series", "blog-data"] }
)

export const readBlogPostDb = unstable_cache(
  async (slug: string): Promise<BlogDb | null> => {
    const pool = getPool()
    const postRow = await pool.query(
      "SELECT * FROM posts WHERE slug=$1 AND status='published' LIMIT 1",
      [slug]
    )
    if (!postRow.rows.length) return null
    const post = rowToPost(postRow.rows[0])
    const postId = post.id

    const [series, siblingPosts, snippets, postVotes] = await Promise.all([
      pool.query("SELECT * FROM series ORDER BY title"),
      pool.query(
        `SELECT id, slug, title, excerpt, cover_image, series_id, status, author_id,
                published_at, created_at, updated_at, NULL::text AS content, NULL::text AS custom_css
         FROM posts WHERE status='published' AND id != $1
         ORDER BY COALESCE(published_at, created_at) ASC`,
        [postId]
      ),
      pool.query("SELECT * FROM snippets ORDER BY created_at DESC"),
      pool.query("SELECT * FROM post_votes WHERE post_id=$1", [postId]),
    ])

    return {
      users: [],
      sessions: [],
      series: series.rows.map(rowToSeries),
      posts: [post, ...siblingPosts.rows.map(rowToPost)],
      snippets: snippets.rows.map(rowToSnippet),
      comments: [],
      commentVotes: [],
      postVotes: postVotes.rows.map(rowToPostVote),
    }
  },
  ["blog-post"],
  { revalidate: CACHE_TTL, tags: ["blog-posts", "blog-data"] }
)

export async function readPostCommentsDb(postSlug: string) {
  const pool = getPool()
  const postRow = await pool.query(
    "SELECT id FROM posts WHERE slug=$1 AND status='published' LIMIT 1",
    [postSlug]
  )
  if (!postRow.rows.length) {
    return { comments: [] as BlogComment[], commentVotes: [] as BlogCommentVote[], users: [] as BlogUser[] }
  }
  const postId = postRow.rows[0].id as string

  const [comments, commentVotes, commentUsers] = await Promise.all([
    pool.query("SELECT * FROM comments WHERE post_id=$1 ORDER BY created_at ASC", [postId]),
    pool.query(
      `SELECT cv.* FROM comment_votes cv
       JOIN comments c ON c.id = cv.comment_id WHERE c.post_id=$1`,
      [postId]
    ),
    pool.query(
      `SELECT DISTINCT u.* FROM users u
       JOIN comments c ON c.user_id = u.id WHERE c.post_id=$1`,
      [postId]
    ),
  ])

  return {
    comments: comments.rows.map(rowToComment),
    commentVotes: commentVotes.rows.map(rowToCommentVote),
    users: commentUsers.rows.map(rowToUser),
  }
}

export async function updateDb<T>(updater: (db: BlogDb) => T): Promise<T> {
  const db = await readDb()
  const result = updater(db)
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    for (const u of db.users) {
      await client.query(
        `INSERT INTO users (id,username,email,password_hash,role,blocked,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT (id) DO UPDATE SET
           username=$2,email=$3,password_hash=$4,role=$5,blocked=$6,updated_at=NOW()`,
        [u.id, u.username, u.email, u.passwordHash, u.role, u.blocked ?? false, u.createdAt]
      )
    }
    for (const s of db.sessions) {
      await client.query(
        `INSERT INTO sessions (id,user_id,token,expires_at,created_at)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (token) DO NOTHING`,
        [randomUUID(), s.userId, s.token, s.expiresAt, s.createdAt]
      )
    }
    for (const s of db.series) {
      await client.query(
        `INSERT INTO series (id,title,slug,description,type,parent_id,theme_class,number_format,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (id) DO UPDATE SET
           title=$2,slug=$3,description=$4,type=$5,parent_id=$6,theme_class=$7,number_format=$8,updated_at=NOW()`,
        [s.id, s.title, s.slug, s.description, s.type, s.parentId, s.themeClass, s.numberFormat, s.createdAt]
      )
    }
    for (const p of db.posts) {
      await client.query(
        `INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at,custom_css,position,cover_image)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           slug=$2,title=$3,excerpt=$4,content=$5,series_id=$6,status=$7,author_id=$8,updated_at=NOW(),published_at=$10,custom_css=$11,position=$12,cover_image=$13`,
        [p.id, p.slug, p.title, p.excerpt, p.content, p.seriesId, p.status, p.authorId, p.createdAt, p.publishedAt, p.customCss ?? null, p.position ?? 0, p.coverImage ?? null]
      )
    }
    for (const s of db.snippets) {
      await client.query(
        `INSERT INTO snippets (id,slug,title,description,html,css,js,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
         ON CONFLICT (id) DO UPDATE SET
           slug=$2,title=$3,description=$4,html=$5,css=$6,js=$7,updated_at=NOW()`,
        [s.id, s.slug, s.title, s.description, s.html, s.css, s.js, s.createdAt]
      )
    }
    for (const c of db.comments) {
      await client.query(
        `INSERT INTO comments (id,post_id,user_id,parent_id,content,hidden,created_at,updated_at,edited_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8)
         ON CONFLICT (id) DO UPDATE SET
           content=$5,hidden=$6,updated_at=NOW(),edited_at=$8`,
        [c.id, c.postId, c.userId, c.parentId, c.content, c.hidden ?? false, c.createdAt, c.editedAt ?? null]
      )
    }
    for (const v of db.commentVotes) {
      await client.query(
        `INSERT INTO comment_votes (id,comment_id,user_id,value,created_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (comment_id,user_id) DO UPDATE SET value=$3`,
        [v.id, v.commentId, v.userId, v.value]
      )
    }
    for (const v of db.postVotes) {
      await client.query(
        `INSERT INTO post_votes (id,post_id,user_id,value,created_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (post_id,user_id) DO UPDATE SET value=$3`,
        [v.id, v.postId, v.userId, v.value]
      )
    }
    await client.query("COMMIT")
    revalidateTag("blog-data")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
  return result
}

export function nowIso() { return new Date().toISOString() }
export function createId() { return randomUUID() }
export function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export function upsertPost(db: BlogDb, post: BlogPost) {
  const idx = db.posts.findIndex((p) => p.id === post.id)
  if (idx >= 0) db.posts[idx] = post; else db.posts.push(post)
}

export function upsertSeries(db: BlogDb, series: BlogSeries) {
  const idx = db.series.findIndex((s) => s.id === series.id)
  if (idx >= 0) db.series[idx] = series; else db.series.push(series)
}

export function upsertSnippet(db: BlogDb, snippet: BlogSnippet) {
  const idx = db.snippets.findIndex((s) => s.id === snippet.id)
  if (idx >= 0) db.snippets[idx] = snippet; else db.snippets.push(snippet)
}

export function getSeriesTree(series: BlogSeries[]): SeriesNode[] {
  const map = new Map<string, SeriesNode>()
  series.forEach((item) => { map.set(item.id, { ...item, children: [] }) })
  const roots: SeriesNode[] = []
  map.forEach((node) => {
    if (!node.parentId) { roots.push(node); return }
    const parent = map.get(node.parentId)
    if (parent) { parent.children.push(node); return }
    roots.push(node)
  })
  return roots.sort((a, b) => a.title.localeCompare(b.title))
}

export function getSeriesPath(series: BlogSeries[], targetId: string | null): BlogSeries[] {
  if (!targetId) return []
  const byId = new Map(series.map((item) => [item.id, item]))
  const chain: BlogSeries[] = []
  let cursor = byId.get(targetId) ?? null
  while (cursor) {
    chain.unshift(cursor)
    cursor = cursor.parentId ? byId.get(cursor.parentId) ?? null : null
  }
  return chain
}

export function getSeriesBySlugPath(series: BlogSeries[], slugPath: string[]): BlogSeries | null {
  let parentId: string | null = null
  let target: BlogSeries | null = null
  for (const slug of slugPath) {
    target = series.find(s => s.slug === slug && s.parentId === parentId) ?? null
    if (!target) return null
    parentId = target.id
  }
  return target
}

export function getCommentTree(comments: BlogComment[], users: BlogUser[], votes: BlogCommentVote[], currentUserId?: string | null): CommentNode[] {
  const userNameById = new Map(users.map((u) => [u.id, u.username]))
  const scoreMap = new Map<string, number>()
  votes.forEach((v) => scoreMap.set(v.commentId, (scoreMap.get(v.commentId) ?? 0) + v.value))
  const nodeMap = new Map<string, CommentNode>()
  comments.forEach((c) => {
    nodeMap.set(c.id, {
      ...c, children: [], username: userNameById.get(c.userId) ?? "Unknown",
      displayName: null, avatarUrl: null, score: scoreMap.get(c.id) ?? 0, currentUserVote: 0
    })
  })
  const roots: CommentNode[] = []
  nodeMap.forEach((node) => {
    if (!node.parentId) { roots.push(node); return }
    const parent = nodeMap.get(node.parentId)
    if (parent) { parent.children.push(node); return }
    roots.push(node)
  })
  return roots
}

export function getPublishedPosts(posts: BlogPost[]) {
  return posts.filter((p) => p.status === "published").sort((a, b) => new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime())
}

export function getPostScore(postVotes: BlogPostVote[], postId: string) {
  return postVotes.filter((v) => v.postId === postId).reduce((sum, v) => sum + v.value, 0)
}

export async function directTogglePostVote(postId: string, userId: string): Promise<number> {
  const pool = getPool()
  try {
    const existing = await pool.query(
      "SELECT id FROM post_votes WHERE post_id=$1 AND user_id=$2",
      [postId, userId]
    )
    if (existing.rows.length > 0) {
      await pool.query("DELETE FROM post_votes WHERE post_id=$1 AND user_id=$2", [postId, userId])
    } else {
      await pool.query(
        "INSERT INTO post_votes (id,post_id,user_id,value,created_at) VALUES (gen_random_uuid(),$1,$2,1,NOW())",
        [postId, userId]
      )
    }
    const scoreRow = await pool.query(
      "SELECT COALESCE(SUM(value),0) AS score FROM post_votes WHERE post_id=$1",
      [postId]
    )
    return Number(scoreRow.rows[0].score)
  } catch (err) { throw err }
}

export async function directToggleCommentVote(commentId: string, userId: string, value: 1 | -1): Promise<number> {
  const pool = getPool()
  try {
    const existing = await pool.query(
      "SELECT id, value FROM comment_votes WHERE comment_id=$1 AND user_id=$2",
      [commentId, userId]
    )
    if (existing.rows.length > 0 && existing.rows[0].value === value) {
      await pool.query("DELETE FROM comment_votes WHERE comment_id=$1 AND user_id=$2", [commentId, userId])
    } else {
      await pool.query(
        "INSERT INTO comment_votes (id,comment_id,user_id,value,created_at) VALUES (gen_random_uuid(),$1,$2,$3,NOW()) ON CONFLICT (comment_id,user_id) DO UPDATE SET value=$3",
        [commentId, userId, value]
      )
    }
    const scoreRow = await pool.query(
      "SELECT COALESCE(SUM(value),0) AS score FROM comment_votes WHERE comment_id=$1",
      [commentId]
    )
    return Number(scoreRow.rows[0].score)
  } catch (err) { throw err }
}
