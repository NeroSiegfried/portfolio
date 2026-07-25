/**
 * Seed / update the portfolio build-log posts and their interactive snippets.
 *
 * Content lives on disk, not in this file:
 *   scripts/build-logs/posts/<slug>.md     post body + front matter
 *   scripts/build-logs/posts/<slug>.css    optional per-post CSS (scoped to .post-body)
 *   scripts/build-logs/snippets/<slug>/    index.html + style.css + script.js + meta.json
 *
 * Posts are keyed by slug and UPSERTED, so this is the way to edit a build log:
 * change the markdown, re-run. Existing rows keep their id, author, comments and
 * votes — only content/excerpt/title/css/series/publishedAt are rewritten.
 *
 * Every run first writes the current DB state of each touched post to
 * scripts/.backups/posts-<timestamp>.json so an overwrite is always reversible.
 *
 *   node scripts/seed-build-logs.mjs             # apply
 *   node scripts/seed-build-logs.mjs --dry-run   # report only, no writes
 *
 * Preview the snippets before seeding with: node scripts/preview-snippets.mjs
 */
import { mkdirSync, writeFileSync } from "fs"
import path from "path"
import { readPosts, readSnippets, referencedSnippetSlugs } from "./build-logs/read-content.mjs"
import { openDb } from "./build-logs/db.mjs"

const BACKUP_DIR = path.resolve("scripts/.backups")
const KNOWN_ADMIN_ID = "fa1e0324-4d75-476c-92f1-7f1acbfd61fa"

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const posts = readPosts()
  const snippets = readSnippets()

  if (!posts.length) throw new Error("no posts found in scripts/build-logs/posts")

  // Fail before touching the DB if a post references a snippet that doesn't exist —
  // a typo'd slug renders as a dashed "Snippet not found" box on the live site.
  const have = new Set(snippets.map((s) => s.slug))
  const missing = [...referencedSnippetSlugs(posts)].filter((s) => !have.has(s))
  if (missing.length) throw new Error(`posts reference unknown snippets: ${missing.join(", ")}`)

  const db = await openDb()

  try {
    const adminRow = await db.query("SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1")
    const authorId = adminRow.rows[0]?.id ?? KNOWN_ADMIN_ID

    // --- back up whatever is currently live for these slugs -------------------
    const slugs = posts.map((p) => p.slug)
    const existing = await db.query(
      `SELECT slug, title, excerpt, content, custom_css, cover_image, series_id, position, status, published_at
         FROM posts WHERE slug = ANY($1)`,
      [slugs],
    )
    if (existing.rowCount > 0 && !dryRun) {
      mkdirSync(BACKUP_DIR, { recursive: true })
      const file = path.join(BACKUP_DIR, `posts-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
      writeFileSync(file, JSON.stringify(existing.rows, null, 2))
      console.log(`↩ backed up ${existing.rowCount} existing post(s) → ${path.relative(process.cwd(), file)}\n`)
    }

    // --- snippets ------------------------------------------------------------
    for (const s of snippets) {
      if (dryRun) {
        console.log(`• would upsert snippet ${s.slug}`)
        continue
      }
      await db.query(
        `INSERT INTO snippets (id, slug, title, description, html, css, js, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           html = EXCLUDED.html,
           css = EXCLUDED.css,
           js = EXCLUDED.js,
           updated_at = NOW()`,
        [s.slug, s.title, s.description, s.html, s.css, s.js],
      )
      console.log(`✓ snippet  ${s.slug}`)
    }

    // --- posts ---------------------------------------------------------------
    console.log("")
    for (const p of posts) {
      let seriesId = null
      if (p.series) {
        const row = await db.query("SELECT id FROM series WHERE slug=$1 LIMIT 1", [p.series])
        if (!row.rows[0]) throw new Error(`post ${p.slug}: unknown series "${p.series}"`)
        seriesId = row.rows[0].id
      }

      const previous = existing.rows.find((r) => r.slug === p.slug)
      if (dryRun) {
        console.log(`• would ${previous ? "update" : "create"} ${p.slug} (${p.content.length} chars)`)
        continue
      }

      await db.query(
        `INSERT INTO posts (id, slug, title, excerpt, content, custom_css, cover_image, series_id, status, author_id,
                            created_at, updated_at, published_at, position)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'published', $8, NOW(), NOW(), COALESCE($9::timestamptz, NOW()), $10)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           excerpt = EXCLUDED.excerpt,
           content = EXCLUDED.content,
           custom_css = EXCLUDED.custom_css,
           -- keep an existing cover image unless the front matter names one
           cover_image = COALESCE(EXCLUDED.cover_image, posts.cover_image),
           series_id = EXCLUDED.series_id,
           status = 'published',
           updated_at = NOW(),
           published_at = COALESCE(posts.published_at, EXCLUDED.published_at),
           position = EXCLUDED.position`,
        [
          p.slug,
          p.title,
          p.excerpt,
          p.content,
          p.customCss,
          p.coverImage,
          seriesId,
          authorId,
          p.publishedAt,
          p.position,
        ],
      )
      const chars = p.content.length.toLocaleString()
      const was = previous ? `${previous.content.length.toLocaleString()} → ` : ""
      console.log(`✓ post     ${p.slug}  (${was}${chars} chars${p.customCss ? ", +css" : ""})`)
    }

    console.log(
      dryRun
        ? `\nDry run: ${snippets.length} snippets, ${posts.length} posts would be written.`
        : `\nDone: ${snippets.length} snippets, ${posts.length} posts.`,
    )
  } finally {
    await db.end()
  }
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
