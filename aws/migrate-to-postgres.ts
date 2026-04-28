/**
 * Migration script: JSON → PostgreSQL
 * Export current blog-db.json data to SQL INSERT statements
 * 
 * Usage: npx ts-node aws/migrate-to-postgres.ts
 */

import fs from "fs"
import path from "path"

interface BlogDb {
  users: any[]
  sessions: any[]
  series: any[]
  posts: any[]
  snippets: any[]
  comments: any[]
  commentVotes: any[]
  postVotes: any[]
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL"
  return "'" + str.replace(/'/g, "''") + "'"
}

function exportData() {
  const dbPath = path.join(process.cwd(), "data", "blog-db.json")

  if (!fs.existsSync(dbPath)) {
    console.error("❌ data/blog-db.json not found")
    process.exit(1)
  }

  const raw = fs.readFileSync(dbPath, "utf8")
  const db: BlogDb = JSON.parse(raw)

  const output: string[] = []

  // Users
  output.push("-- USERS")
  for (const user of db.users) {
    output.push(
      `INSERT INTO "users" ("id", "username", "email", "password_hash", "role", "created_at", "updated_at") ` +
        `VALUES (${escapeSql(user.id)}, ${escapeSql(user.username)}, ${escapeSql(user.email)}, ` +
        `${escapeSql(user.passwordHash)}, ${escapeSql(user.role)}, ${escapeSql(user.createdAt)}, ${escapeSql(user.updatedAt)});`
    )
  }

  // Sessions
  output.push("\n-- SESSIONS")
  for (const session of db.sessions) {
    output.push(
      `INSERT INTO "sessions" ("id", "user_id", "token", "expires_at", "created_at") ` +
        `VALUES (${escapeSql(session.id)}, ${escapeSql(session.userId)}, ${escapeSql(session.token)}, ` +
        `${escapeSql(session.expiresAt)}, ${escapeSql(session.createdAt)});`
    )
  }

  // Series
  output.push("\n-- SERIES")
  for (const series of db.series) {
    output.push(
      `INSERT INTO "series" ("id", "title", "slug", "description", "type", "parent_id", "theme_class", "number_format", "created_at", "updated_at") ` +
        `VALUES (${escapeSql(series.id)}, ${escapeSql(series.title)}, ${escapeSql(series.slug)}, ` +
        `${escapeSql(series.description)}, ${escapeSql(series.type)}, ${escapeSql(series.parentId)}, ` +
        `${escapeSql(series.themeClass)}, ${escapeSql(series.numberFormat)}, ${escapeSql(series.createdAt)}, ${escapeSql(series.updatedAt)});`
    )
  }

  // Posts
  output.push("\n-- POSTS")
  for (const post of db.posts) {
    output.push(
      `INSERT INTO "posts" ("id", "slug", "title", "excerpt", "content", "series_id", "status", "author_id", "created_at", "updated_at", "published_at") ` +
        `VALUES (${escapeSql(post.id)}, ${escapeSql(post.slug)}, ${escapeSql(post.title)}, ` +
        `${escapeSql(post.excerpt)}, ${escapeSql(post.content)}, ${escapeSql(post.seriesId)}, ` +
        `${escapeSql(post.status)}, ${escapeSql(post.authorId)}, ${escapeSql(post.createdAt)}, ${escapeSql(post.updatedAt)}, ${escapeSql(post.publishedAt)});`
    )
  }

  // Snippets
  output.push("\n-- SNIPPETS")
  for (const snippet of db.snippets) {
    output.push(
      `INSERT INTO "snippets" ("id", "slug", "title", "description", "html", "css", "js", "created_at", "updated_at") ` +
        `VALUES (${escapeSql(snippet.id)}, ${escapeSql(snippet.slug)}, ${escapeSql(snippet.title)}, ` +
        `${escapeSql(snippet.description)}, ${escapeSql(snippet.html)}, ${escapeSql(snippet.css)}, ` +
        `${escapeSql(snippet.js)}, ${escapeSql(snippet.createdAt)}, ${escapeSql(snippet.updatedAt)});`
    )
  }

  // Comments
  output.push("\n-- COMMENTS")
  for (const comment of db.comments) {
    output.push(
      `INSERT INTO "comments" ("id", "post_id", "user_id", "parent_id", "content", "hidden", "created_at", "updated_at", "edited_at") ` +
        `VALUES (${escapeSql(comment.id)}, ${escapeSql(comment.postId)}, ${escapeSql(comment.userId)}, ` +
        `${escapeSql(comment.parentId)}, ${escapeSql(comment.content)}, ${comment.hidden ? "true" : "false"}, ` +
        `${escapeSql(comment.createdAt)}, ${escapeSql(comment.updatedAt)}, ${escapeSql(comment.editedAt)});`
    )
  }

  // Comment Votes
  output.push("\n-- COMMENT VOTES")
  for (const vote of db.commentVotes) {
    output.push(
      `INSERT INTO "comment_votes" ("id", "comment_id", "user_id", "value", "created_at") ` +
        `VALUES (${escapeSql(vote.id)}, ${escapeSql(vote.commentId)}, ${escapeSql(vote.userId)}, ` +
        `${vote.value}, ${escapeSql(vote.createdAt)});`
    )
  }

  // Post Votes
  output.push("\n-- POST VOTES")
  for (const vote of db.postVotes) {
    output.push(
      `INSERT INTO "post_votes" ("id", "post_id", "user_id", "value", "created_at") ` +
        `VALUES (${escapeSql(vote.id)}, ${escapeSql(vote.postId)}, ${escapeSql(vote.userId)}, ` +
        `${vote.value}, ${escapeSql(vote.createdAt)});`
    )
  }

  const sqlFile = path.join(process.cwd(), "aws", "data-export.sql")
  fs.writeFileSync(sqlFile, output.join("\n"), "utf8")

  console.log(`✅ Exported ${db.posts.length} posts, ${db.series.length} series, ${db.comments.length} comments`)
  console.log(`📄 SQL file: aws/data-export.sql`)
  console.log("\nNext steps:")
  console.log("1. Create RDS instance")
  console.log("2. Apply postgres-schema.sql")
  console.log("3. Apply data-export.sql")
  console.log("4. Update .env.local with DB connection string")
}

exportData()
