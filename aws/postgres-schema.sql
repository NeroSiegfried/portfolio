-- PostgreSQL Schema for portfolio_db

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY,
  "username" VARCHAR(255) NOT NULL UNIQUE,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password_hash" VARCHAR(512),
  "role" VARCHAR(50) NOT NULL DEFAULT 'user',
  "blocked" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" VARCHAR(255) NOT NULL UNIQUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "series" (
  "id" TEXT PRIMARY KEY,
  "title" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "type" VARCHAR(50) NOT NULL DEFAULT 'general',
  "parent_id" TEXT REFERENCES "series"("id") ON DELETE SET NULL,
  "theme_class" VARCHAR(255),
  "number_format" VARCHAR(255),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "posts" (
  "id" TEXT PRIMARY KEY,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "title" VARCHAR(255) NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "series_id" TEXT REFERENCES "series"("id") ON DELETE SET NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
  "author_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "snippets" (
  "id" TEXT PRIMARY KEY,
  "slug" VARCHAR(255) NOT NULL UNIQUE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "html" TEXT,
  "css" TEXT,
  "js" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "comments" (
  "id" TEXT PRIMARY KEY,
  "post_id" TEXT NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "parent_id" TEXT REFERENCES "comments"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "hidden" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "edited_at" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "comment_votes" (
  "id" TEXT PRIMARY KEY,
  "comment_id" TEXT NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "value" SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("comment_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "post_votes" (
  "id" TEXT PRIMARY KEY,
  "post_id" TEXT NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "value" SMALLINT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("post_id", "user_id")
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);

-- ─── Newsletter (self-hosted double opt-in) ──────────────────────────────────
-- Also created lazily at runtime by lib/newsletter/store.ts (ensureNewsletterTables).
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  "id"                TEXT PRIMARY KEY,
  "email"             TEXT UNIQUE NOT NULL,
  "status"            TEXT NOT NULL DEFAULT 'pending',   -- pending | confirmed | unsubscribed
  "confirm_token"     TEXT,
  "unsubscribe_token" TEXT NOT NULL,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmed_at"      TIMESTAMPTZ,
  "unsubscribed_at"   TIMESTAMPTZ,
  "ip"                TEXT
);
CREATE INDEX IF NOT EXISTS idx_newsletter_confirm_token ON newsletter_subscribers(confirm_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_unsub_token ON newsletter_subscribers(unsubscribe_token);

-- ─── Rate limiting (fixed-window; lib/security/rate-limit.ts) ─────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  "id"         TEXT PRIMARY KEY,
  "count"      INTEGER NOT NULL DEFAULT 0,
  "expires_at" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);
