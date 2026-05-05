import { randomUUID } from "crypto"
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

// Store the pool on `global` so Next.js HMR hot-reloads don't create a new
// pool on every module evaluation (which leaks connections and causes
// "Connection terminated unexpectedly" errors in development).
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
  // eslint-disable-next-line no-var
  var _homeDbCache: { data: BlogDb; expires: number } | undefined
  // eslint-disable-next-line no-var
  var _seriesDbCache: { data: BlogDb; expires: number } | undefined
  // eslint-disable-next-line no-var
  var _postDbCache: Map<string, { data: BlogDb | null; expires: number }> | undefined
}

export function getPool(): Pool {
  if (!global._pgPool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
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

// ─── Targeted reads (avoid fetching all 8 tables for read-only pages) ─────────

/** Blog home: only posts + series + post_votes (no content, no comments, no users). */
const HOME_TTL_MS = 60_000

export async function readBlogHomeDb(): Promise<BlogDb> {
  if (global._homeDbCache && global._homeDbCache.expires > Date.now()) {
    return global._homeDbCache.data
  }
  const pool = getPool()
  const [series, posts, postVotes] = await Promise.all([
    pool.query("SELECT * FROM series ORDER BY title"),
    pool.query(
      `SELECT id, slug, title, excerpt, series_id, status, author_id,
              published_at, created_at, updated_at, NULL::text AS content, NULL::text AS custom_css
       FROM posts WHERE status='published' ORDER BY COALESCE(published_at, created_at) DESC`
    ),
    pool.query("SELECT * FROM post_votes"),
  ])
  const data: BlogDb = {
    users: [],
    sessions: [],
    series: series.rows.map(rowToSeries),
    posts: posts.rows.map(rowToPost),
    snippets: [],
    comments: [],
    commentVotes: [],
    postVotes: postVotes.rows.map(rowToPostVote),
  }
  global._homeDbCache = { data, expires: Date.now() + HOME_TTL_MS }
  return data
}

const SERIES_TTL_MS = 60_000

export async function readSeriesDb(): Promise<BlogDb> {
  if (global._seriesDbCache && global._seriesDbCache.expires > Date.now()) {
    return global._seriesDbCache.data
  }
  const pool = getPool()
  const [series, posts, postVotes] = await Promise.all([
    pool.query("SELECT * FROM series ORDER BY title"),
    pool.query(
      `SELECT id, slug, title, excerpt, series_id, status, author_id,
              published_at, created_at, updated_at, NULL::text AS content, NULL::text AS custom_css
       FROM posts WHERE status='published' ORDER BY COALESCE(published_at, created_at) DESC`
    ),
    pool.query("SELECT * FROM post_votes"),
  ])
  const data: BlogDb = {
    users: [],
    sessions: [],
    series: series.rows.map(rowToSeries),
    posts: posts.rows.map(rowToPost),
    snippets: [],
    comments: [],
    commentVotes: [],
    postVotes: postVotes.rows.map(rowToPostVote),
  }
  global._seriesDbCache = { data, expires: Date.now() + SERIES_TTL_MS }
  return data
}

const POST_TTL_MS = 60_000

function getPostDbCache() {
  if (!global._postDbCache) global._postDbCache = new Map()
  return global._postDbCache
}

/**
 * Blog post page: the specific post (full content) + series + snippets +
 * post_votes for that post + sibling posts (no content) for series-nav.
 * Comments are intentionally omitted — they are lazy-loaded client-side
 * via /api/blog/posts/[slug]/comments so they don't block initial paint.
 */
export async function readBlogPostDb(slug: string): Promise<BlogDb | null> {
  const cache = getPostDbCache()
  const cached = cache.get(slug)
  if (cached && cached.expires > Date.now()) return cached.data

  const pool = getPool()
  const postRow = await pool.query(
    "SELECT * FROM posts WHERE slug=$1 AND status='published' LIMIT 1",
    [slug]
  )
  if (!postRow.rows.length) {
    cache.set(slug, { data: null, expires: Date.now() + POST_TTL_MS })
    return null
  }
  const post = rowToPost(postRow.rows[0])
  const postId = post.id

  const [series, siblingPosts, snippets, postVotes] = await Promise.all([
    pool.query("SELECT * FROM series ORDER BY title"),
    pool.query(
      `SELECT id, slug, title, excerpt, series_id, status, author_id,
              published_at, created_at, updated_at, NULL::text AS content, NULL::text AS custom_css
       FROM posts WHERE status='published' AND id != $1
       ORDER BY COALESCE(published_at, created_at) ASC`,
      [postId]
    ),
    pool.query("SELECT * FROM snippets ORDER BY created_at DESC"),
    pool.query("SELECT * FROM post_votes WHERE post_id=$1", [postId]),
  ])

  const data: BlogDb = {
    users: [],
    sessions: [],
    series: series.rows.map(rowToSeries),
    posts: [post, ...siblingPosts.rows.map(rowToPost)],
    snippets: snippets.rows.map(rowToSnippet),
    comments: [],
    commentVotes: [],
    postVotes: postVotes.rows.map(rowToPostVote),
  }
  cache.set(slug, { data, expires: Date.now() + POST_TTL_MS })
  return data
}

/** Fetch comments + votes + users for a single post (used by the lazy-load API route). No cache — must always be fresh so mutations are immediately visible. */
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

// ─────────────────────────────────────────────────────────────────────────────

/** Reads the full DB, runs the synchronous updater, then persists all deltas. */
export async function updateDb<T>(updater: (db: BlogDb) => T): Promise<T> {
  const db = await readDb()

  // Snapshot keys before mutation
  const before = {
    users: new Set(db.users.map((u) => u.id)),
    sessions: new Set(db.sessions.map((s) => s.token)),
    series: new Set(db.series.map((s) => s.id)),
    posts: new Set(db.posts.map((p) => p.id)),
    snippets: new Set(db.snippets.map((s) => s.id)),
    comments: new Set(db.comments.map((c) => c.id)),
    commentVotes: new Set(db.commentVotes.map((v) => v.id)),
    postVotes: new Set(db.postVotes.map((v) => v.id)),
  }

  const result = updater(db)

  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Upsert / delete users
    for (const u of db.users) {
      await client.query(
        `INSERT INTO users (id,username,email,password_hash,role,blocked,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
         ON CONFLICT (id) DO UPDATE SET
           username=$2,email=$3,password_hash=$4,role=$5,blocked=$6,updated_at=NOW()`,
        [u.id, u.username, u.email, u.passwordHash, u.role, u.blocked ?? false, u.createdAt]
      )
    }
    const keptUsers = new Set(db.users.map((u) => u.id))
    for (const id of before.users) {
      if (!keptUsers.has(id)) await client.query("DELETE FROM users WHERE id=$1", [id])
    }

    // Upsert / delete sessions
    for (const s of db.sessions) {
      await client.query(
        `INSERT INTO sessions (id,user_id,token,expires_at,created_at)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (token) DO NOTHING`,
        [randomUUID(), s.userId, s.token, s.expiresAt, s.createdAt]
      )
    }
    const keptSessions = new Set(db.sessions.map((s) => s.token))
    for (const token of before.sessions) {
      if (!keptSessions.has(token)) await client.query("DELETE FROM sessions WHERE token=$1", [token])
    }

    // Upsert / delete series
    for (const s of db.series) {
      await client.query(
        `INSERT INTO series (id,title,slug,description,type,parent_id,theme_class,number_format,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (id) DO UPDATE SET
           title=$2,slug=$3,description=$4,type=$5,parent_id=$6,theme_class=$7,number_format=$8,updated_at=NOW()`,
        [s.id, s.title, s.slug, s.description, s.type, s.parentId, s.themeClass, s.numberFormat, s.createdAt]
      )
    }
    const keptSeries = new Set(db.series.map((s) => s.id))
    for (const id of before.series) {
      if (!keptSeries.has(id)) await client.query("DELETE FROM series WHERE id=$1", [id])
    }

    // Upsert / delete posts
    for (const p of db.posts) {
      await client.query(
        `INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at,custom_css,position)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET
           slug=$2,title=$3,excerpt=$4,content=$5,series_id=$6,status=$7,author_id=$8,updated_at=NOW(),published_at=$10,custom_css=$11,position=$12`,
        [p.id, p.slug, p.title, p.excerpt, p.content, p.seriesId, p.status, p.authorId, p.createdAt, p.publishedAt, p.customCss ?? null, p.position ?? 0]
      )
    }
    const keptPosts = new Set(db.posts.map((p) => p.id))
    for (const id of before.posts) {
      if (!keptPosts.has(id)) await client.query("DELETE FROM posts WHERE id=$1", [id])
    }

    // Upsert / delete snippets
    for (const s of db.snippets) {
      await client.query(
        `INSERT INTO snippets (id,slug,title,description,html,css,js,created_at,updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
         ON CONFLICT (id) DO UPDATE SET
           slug=$2,title=$3,description=$4,html=$5,css=$6,js=$7,updated_at=NOW()`,
        [s.id, s.slug, s.title, s.description, s.html, s.css, s.js, s.createdAt]
      )
    }
    const keptSnippets = new Set(db.snippets.map((s) => s.id))
    for (const id of before.snippets) {
      if (!keptSnippets.has(id)) await client.query("DELETE FROM snippets WHERE id=$1", [id])
    }

    // Upsert / delete comments
    for (const c of db.comments) {
      await client.query(
        `INSERT INTO comments (id,post_id,user_id,parent_id,content,hidden,created_at,updated_at,edited_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8)
         ON CONFLICT (id) DO UPDATE SET
           content=$5,hidden=$6,updated_at=NOW(),edited_at=$8`,
        [c.id, c.postId, c.userId, c.parentId, c.content, c.hidden ?? false, c.createdAt, c.editedAt ?? null]
      )
    }
    const keptComments = new Set(db.comments.map((c) => c.id))
    for (const id of before.comments) {
      if (!keptComments.has(id)) await client.query("DELETE FROM comments WHERE id=$1", [id])
    }

    // Upsert / delete comment votes
    for (const v of db.commentVotes) {
      await client.query(
        `INSERT INTO comment_votes (id,comment_id,user_id,value,created_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (comment_id,user_id) DO UPDATE SET value=$4`,
        [v.id, v.commentId, v.userId, v.value]
      )
    }
    const keptCVotes = new Set(db.commentVotes.map((v) => v.id))
    for (const id of before.commentVotes) {
      if (!keptCVotes.has(id)) await client.query("DELETE FROM comment_votes WHERE id=$1", [id])
    }

    // Upsert / delete post votes
    for (const v of db.postVotes) {
      await client.query(
        `INSERT INTO post_votes (id,post_id,user_id,value,created_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (post_id,user_id) DO UPDATE SET value=$4`,
        [v.id, v.postId, v.userId, v.value]
      )
    }
    const keptPVotes = new Set(db.postVotes.map((v) => v.id))
    for (const id of before.postVotes) {
      if (!keptPVotes.has(id)) await client.query("DELETE FROM post_votes WHERE id=$1", [id])
    }

    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }

  return result
}

export function nowIso() {
  return new Date().toISOString()
}

export function createId() {
  return randomUUID()
}

export function getSeriesTree(series: BlogSeries[]): SeriesNode[] {
  const map = new Map<string, SeriesNode>()

  series.forEach((item) => {
    map.set(item.id, { ...item, children: [] })
  })

  const roots: SeriesNode[] = []

  map.forEach((node) => {
    if (!node.parentId) {
      roots.push(node)
      return
    }

    const parent = map.get(node.parentId)
    if (parent) {
      parent.children.push(node)
      return
    }

    roots.push(node)
  })

  return roots.sort((first, second) => first.title.localeCompare(second.title))
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
    target =
      series.find(
        (item) => item.slug === slug && (item.parentId ?? null) === (parentId ?? null)
      ) ?? null

    if (!target) return null
    parentId = target.id
  }

  return target
}

export function getCommentTree(
  comments: BlogComment[],
  users: BlogUser[],
  votes: BlogCommentVote[],
  currentUserId?: string | null
): CommentNode[] {
  const userNameById = new Map(users.map((user) => [user.id, user.username]))
  const userDisplayNameById = new Map(users.map((user) => [user.id, user.displayName ?? null]))
  const userAvatarUrlById = new Map(users.map((user) => [user.id, user.avatarUrl ?? null]))
  const scoreByCommentId = new Map<string, number>()
  const userVoteByCommentId = new Map<string, 1 | -1>()

  votes.forEach((vote) => {
    scoreByCommentId.set(vote.commentId, (scoreByCommentId.get(vote.commentId) ?? 0) + vote.value)
    if (currentUserId && vote.userId === currentUserId) {
      userVoteByCommentId.set(vote.commentId, vote.value as 1 | -1)
    }
  })

  const nodeMap = new Map<string, CommentNode>()

  comments.forEach((comment) => {
    nodeMap.set(comment.id, {
      ...comment,
      children: [],
      username: userNameById.get(comment.userId) ?? "Unknown",
      displayName: userDisplayNameById.get(comment.userId) ?? null,
      avatarUrl: userAvatarUrlById.get(comment.userId) ?? null,
      score: scoreByCommentId.get(comment.id) ?? 0,
      currentUserVote: userVoteByCommentId.get(comment.id) ?? 0,
    })
  })

  const roots: CommentNode[] = []

  nodeMap.forEach((node) => {
    if (!node.parentId) {
      roots.push(node)
      return
    }

    const parent = nodeMap.get(node.parentId)
    if (parent) {
      parent.children.push(node)
      return
    }

    roots.push(node)
  })

  const sortNodes = (nodes: CommentNode[]) => {
    nodes.sort((first, second) =>
      new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
    )
    nodes.forEach((node) => sortNodes(node.children))
  }

  sortNodes(roots)
  return roots
}

export function getPublishedPosts(posts: BlogPost[]) {
  return posts
    .filter((post) => post.status === "published")
    .sort((first, second) => {
      // Explicit position takes precedence (0 = unset, treated as timestamp-based ordering)
      const fp = first.position ?? 0
      const sp = second.position ?? 0
      if (fp !== 0 || sp !== 0) {
        // Both positioned: sort ascending by position
        if (fp !== 0 && sp !== 0) return fp - sp
        // Only one positioned: positioned items come before unpositioned
        if (fp !== 0) return -1
        return 1
      }
      // Fallback: sort by publishedAt ?? createdAt descending (newest first for the main blog list)
      const firstTs = new Date(first.publishedAt ?? first.createdAt).getTime()
      const secondTs = new Date(second.publishedAt ?? second.createdAt).getTime()
      if (firstTs !== secondTs) return secondTs - firstTs
      const fc = new Date(first.createdAt).getTime()
      const sc = new Date(second.createdAt).getTime()
      if (fc !== sc) return sc - fc
      return first.id.localeCompare(second.id)
    })
}

export function getPostScore(postVotes: BlogPostVote[], postId: string) {
  return postVotes
    .filter((vote) => vote.postId === postId)
    .reduce((sum, vote) => sum + vote.value, 0)
}

export function getPostVote(postVotes: BlogPostVote[], postId: string, userId: string) {
  return postVotes.find((vote) => vote.postId === postId && vote.userId === userId) ?? null
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

// Re-export from client-safe format module so server code can use it too
export { formatSeriesEntry } from "@/lib/blog/format"

export function upsertUser(db: BlogDb, user: BlogUser) {
  const index = db.users.findIndex((entry) => entry.id === user.id)
  if (index === -1) {
    db.users.push(user)
  } else {
    db.users[index] = user
  }
}

export function upsertSeries(db: BlogDb, series: BlogSeries) {
  const index = db.series.findIndex((entry) => entry.id === series.id)
  if (index === -1) {
    db.series.push(series)
  } else {
    db.series[index] = series
  }
}

export function upsertSnippet(db: BlogDb, snippet: BlogSnippet) {
  const index = db.snippets.findIndex((entry) => entry.id === snippet.id)
  if (index === -1) {
    db.snippets.push(snippet)
  } else {
    db.snippets[index] = snippet
  }
}

export function upsertPost(db: BlogDb, post: BlogPost) {
  const index = db.posts.findIndex((entry) => entry.id === post.id)
  if (index === -1) {
    db.posts.push(post)
  } else {
    db.posts[index] = post
  }
}

export function upsertSession(db: BlogDb, session: BlogSession) {
  const index = db.sessions.findIndex((entry) => entry.token === session.token)
  if (index === -1) {
    db.sessions.push(session)
  } else {
    db.sessions[index] = session
  }
}

// ─── Direct SQL helpers (bypass full readDb/updateDb cycle) ──────────────────

/**
 * Toggle a post upvote for a user.
 * Returns the new net score for the post.
 */
export async function directTogglePostVote(postId: string, userId: string): Promise<number> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const existing = await client.query(
      "SELECT id FROM post_votes WHERE post_id=$1 AND user_id=$2",
      [postId, userId]
    )

    if (existing.rows.length > 0) {
      await client.query("DELETE FROM post_votes WHERE post_id=$1 AND user_id=$2", [postId, userId])
    } else {
      await client.query(
        "INSERT INTO post_votes (id,post_id,user_id,value,created_at) VALUES (gen_random_uuid(),$1,$2,1,NOW()) ON CONFLICT (post_id,user_id) DO UPDATE SET value=1",
        [postId, userId]
      )
    }

    await client.query("COMMIT")

    const scoreRow = await client.query(
      "SELECT COALESCE(SUM(value),0) AS score FROM post_votes WHERE post_id=$1",
      [postId]
    )
    return Number(scoreRow.rows[0].score)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

/**
 * Toggle a comment vote (1 = up, -1 = down) for a user.
 * Same value = toggle off; different value = switch vote.
 * Returns the new net score for the comment.
 */
export async function directToggleCommentVote(
  commentId: string,
  userId: string,
  value: 1 | -1
): Promise<number> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    const existing = await client.query(
      "SELECT id, value FROM comment_votes WHERE comment_id=$1 AND user_id=$2",
      [commentId, userId]
    )

    if (existing.rows.length > 0 && existing.rows[0].value === value) {
      // Same vote → remove (toggle off)
      await client.query("DELETE FROM comment_votes WHERE comment_id=$1 AND user_id=$2", [commentId, userId])
    } else {
      await client.query(
        `INSERT INTO comment_votes (id,comment_id,user_id,value,created_at)
         VALUES (gen_random_uuid(),$1,$2,$3,NOW())
         ON CONFLICT (comment_id,user_id) DO UPDATE SET value=$3`,
        [commentId, userId, value]
      )
    }

    await client.query("COMMIT")

    const scoreRow = await client.query(
      "SELECT COALESCE(SUM(value),0) AS score FROM comment_votes WHERE comment_id=$1",
      [commentId]
    )
    return Number(scoreRow.rows[0].score)
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}
