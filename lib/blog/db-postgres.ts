/**
 * PostgreSQL Database Client for Blog
 * Replaces file-based JSON storage with RDS queries
 * 
 * Environment setup:
 * - DATABASE_URL: postgresql://user:password@host:port/database
 */

import { Pool, PoolClient } from 'pg'
import type {
  BlogDb,
  BlogUser,
  BlogSession,
  BlogSeries,
  BlogPost,
  BlogSnippet,
  BlogComment,
  BlogCommentVote,
  BlogPostVote,
} from './types'

// Connection pool
let pool: Pool | null = null

export function initDb() {
  if (pool) return pool

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL not set in environment')
  }

  pool = new Pool({
    connectionString: url,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  return pool
}

export async function getDb(): Promise<BlogDb> {
  const pool = initDb()

  const [users, sessions, series, posts, snippets, comments, commentVotes, postVotes] = await Promise.all([
    pool.query('SELECT * FROM users ORDER BY created_at DESC'),
    pool.query('SELECT * FROM sessions ORDER BY created_at DESC'),
    pool.query('SELECT * FROM series ORDER BY title'),
    pool.query('SELECT * FROM posts ORDER BY updated_at DESC'),
    pool.query('SELECT * FROM snippets ORDER BY created_at DESC'),
    pool.query('SELECT * FROM comments ORDER BY created_at DESC'),
    pool.query('SELECT * FROM comment_votes ORDER BY created_at DESC'),
    pool.query('SELECT * FROM post_votes ORDER BY created_at DESC'),
  ])

  // Transform database rows to match JSON schema
  return {
    users: users.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    sessions: sessions.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    })),
    series: series.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      type: row.type,
      parentId: row.parent_id,
      themeClass: row.theme_class,
      numberFormat: row.number_format,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    posts: posts.rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.content,
      seriesId: row.series_id,
      status: row.status,
      authorId: row.author_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    })),
    snippets: snippets.rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      html: row.html,
      css: row.css,
      js: row.js,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    comments: comments.rows.map(row => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      parentId: row.parent_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      editedAt: row.edited_at,
      hidden: row.hidden,
    })),
    commentVotes: commentVotes.rows.map(row => ({
      id: row.id,
      commentId: row.comment_id,
      userId: row.user_id,
      value: row.value,
      createdAt: row.created_at,
    })),
    postVotes: postVotes.rows.map(row => ({
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      value: row.value,
      createdAt: row.created_at,
    })),
  }
}

export async function upsertUser(user: BlogUser) {
  const pool = initDb()
  await pool.query(
    `INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       username = $2, email = $3, password_hash = $4, role = $5, updated_at = $7`,
    [user.id, user.username, user.email, user.passwordHash, user.role, user.createdAt, user.updatedAt]
  )
}

export async function upsertSession(session: BlogSession) {
  const pool = initDb()
  await pool.query(
    `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       user_id = $2, token = $3, expires_at = $4`,
    [session.id, session.userId, session.token, session.expiresAt, session.createdAt]
  )
}

export async function upsertSeries(series: BlogSeries) {
  const pool = initDb()
  await pool.query(
    `INSERT INTO series (id, title, slug, description, type, parent_id, theme_class, number_format, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       title = $2, slug = $3, description = $4, type = $5, parent_id = $6, theme_class = $7, number_format = $8, updated_at = $10`,
    [
      series.id,
      series.title,
      series.slug,
      series.description,
      series.type,
      series.parentId,
      series.themeClass,
      series.numberFormat,
      series.createdAt,
      series.updatedAt,
    ]
  )
}

export async function upsertPost(post: BlogPost) {
  const pool = initDb()
  await pool.query(
    `INSERT INTO posts (id, slug, title, excerpt, content, series_id, status, author_id, created_at, updated_at, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       slug = $2, title = $3, excerpt = $4, content = $5, series_id = $6, status = $7, author_id = $8, updated_at = $10, published_at = $11`,
    [
      post.id,
      post.slug,
      post.title,
      post.excerpt,
      post.content,
      post.seriesId,
      post.status,
      post.authorId,
      post.createdAt,
      post.updatedAt,
      post.publishedAt,
    ]
  )
}

export async function upsertSnippet(snippet: BlogSnippet) {
  const pool = initDb()
  await pool.query(
    `INSERT INTO snippets (id, slug, title, description, html, css, js, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       slug = $2, title = $3, description = $4, html = $5, css = $6, js = $7, updated_at = $9`,
    [snippet.id, snippet.slug, snippet.title, snippet.description, snippet.html, snippet.css, snippet.js, snippet.createdAt, snippet.updatedAt]
  )
}

export async function upsertComment(comment: BlogComment) {
  const pool = initDb()
  await pool.query(
    `INSERT INTO comments (id, post_id, user_id, parent_id, content, hidden, created_at, updated_at, edited_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       content = $5, hidden = $6, updated_at = $8, edited_at = $9`,
    [
      comment.id,
      comment.postId,
      comment.userId,
      comment.parentId,
      comment.content,
      comment.hidden || false,
      comment.createdAt,
      comment.updatedAt,
      comment.editedAt,
    ]
  )
}

export async function upsertCommentVote(vote: BlogCommentVote) {
  const pool = initDb()
  await pool.query(
    `INSERT INTO comment_votes (id, comment_id, user_id, value, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (comment_id, user_id) DO UPDATE SET
       value = $4`,
    [vote.id, vote.commentId, vote.userId, vote.value, vote.createdAt]
  )
}

export async function upsertPostVote(vote: BlogPostVote) {
  const pool = initDb()
  await pool.query(
    `INSERT INTO post_votes (id, post_id, user_id, value, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (post_id, user_id) DO UPDATE SET
       value = $4`,
    [vote.id, vote.postId, vote.userId, vote.value, vote.createdAt]
  )
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
