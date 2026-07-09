/**
 * Seed / ensure a build-log blog post exists for each featured portfolio project.
 *
 * Build logs are ordinary blog posts in the "Portfolio Projects" series, authored
 * by the site admin and published. The blog post page (`app/blog/[slug]/page.tsx`)
 * automatically renders the project's live-site + repository links for any post
 * whose slug matches a project's `blogPostSlug` (see `projectByBlogSlug`), so the
 * content below is a starter that also restates those links inline.
 *
 * Idempotent: a project whose slug already exists is skipped, so this is safe to
 * re-run (e.g. after adding a new featured project).
 *
 *   node scripts/seed-build-logs.mjs            # create missing build logs
 *   node scripts/seed-build-logs.mjs --dry-run  # report only, no writes
 *
 * Keep this list in sync with the featured projects in `lib/portfolio-data.ts`.
 */
import { Pool } from "pg"
import { readFileSync } from "fs"

// Featured website projects (the Work section) → their build-log slug + links.
const PROJECTS = [
  {
    slug: "derivian-build-log",
    title: "Derivian — Supported Living Website",
    description:
      "A professional, fully accessible website for a supported living business in London — including an easy-read mode for visually impaired users, business email infrastructure and templated contact flows.",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    liveUrl: "https://www.derivian.co.uk",
    githubUrl: "https://github.com/NeroSiegfried/derivian-care",
  },
  {
    slug: "sunab-build-log",
    title: "Sunab Telecommunications — Build Log",
    description:
      "Marketing site for a Nigerian telecoms company that connects mobile network operators — interconnection and clearing-house solutions for stable routing, accurate billing and consistent service across Nigeria and beyond.",
    technologies: ["React", "Vite", "Tailwind CSS", "React Router"],
    liveUrl: "https://sunabtelecomservices.com/",
    githubUrl: "https://github.com/NeroSiegfried/sunab-telecommunications",
  },
  {
    slug: "stitch-bloom",
    title: "Stitch Bloom Build Log",
    description: "A custom web application and showcase for the Stitch Bloom brand.",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    liveUrl: "https://thestitchbloom.com/",
    githubUrl: "https://github.com/NeroSiegfried/stitch-bloom",
  },
  {
    slug: "loopbridge-build-log",
    title: "LoopBridge Build Log",
    description:
      "A website development project for a crypto trading community, built in plain HTML, CSS and JavaScript to keep contribution simple across different frontend stacks.",
    technologies: ["HTML", "CSS", "JavaScript"],
    liveUrl: "https://www.loopbridge.network",
    githubUrl: "https://github.com/NeroSiegfried/LoopBridge",
  },
]

const PORTFOLIO_SERIES_SLUG = "portfolio-projects"
const KNOWN_ADMIN_ID = "fa1e0324-4d75-476c-92f1-7f1acbfd61fa"

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    const m = env.match(/^DATABASE_URL=(.+)$/m)
    if (m) return m[1].trim()
  } catch {
    /* no .env.local */
  }
  throw new Error("DATABASE_URL is not set (env or .env.local)")
}

function buildContent(p) {
  return [
    `# ${p.title}`,
    "",
    p.description,
    "",
    `**Live site:** ${p.liveUrl}`,
    p.githubUrl ? `**Repository:** ${p.githubUrl}` : "",
    "",
    `**Stack:** ${p.technologies.join(", ")}`,
    "",
    "---",
    "",
    "_Full build log coming soon — architecture decisions, the tricky parts, and what I'd do differently._",
  ]
    .filter((line) => line !== undefined)
    .join("\n")
}

function excerptFor(p) {
  const d = p.description.trim()
  return d.length > 155 ? `${d.slice(0, 152).trimEnd()}…` : d
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const url = resolveDatabaseUrl()
  const useSsl = url.includes("rds.amazonaws.com") || url.includes("sslmode=require") || url.includes("neon.tech")
  const pool = new Pool({ connectionString: url, ssl: useSsl ? { rejectUnauthorized: false } : false, max: 1 })

  try {
    // Resolve the portfolio series id (fall back to the known 's_portfolio' id).
    const seriesRow = await pool.query("SELECT id FROM series WHERE slug=$1 LIMIT 1", [PORTFOLIO_SERIES_SLUG])
    const seriesId = seriesRow.rows[0]?.id ?? "s_portfolio"

    // Resolve an admin author (fall back to the known admin id).
    const adminRow = await pool.query("SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1")
    const authorId = adminRow.rows[0]?.id ?? KNOWN_ADMIN_ID

    let created = 0
    for (const p of PROJECTS) {
      const exists = await pool.query("SELECT id FROM posts WHERE slug=$1 LIMIT 1", [p.slug])
      if (exists.rowCount > 0) {
        console.log(`• skip   ${p.slug} (already exists)`)
        continue
      }
      if (dryRun) {
        console.log(`• would create ${p.slug}`)
        created++
        continue
      }
      await pool.query(
        `INSERT INTO posts (id, slug, title, excerpt, content, series_id, status, author_id, created_at, updated_at, published_at, position)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'published', $6, NOW(), NOW(), NOW(), 0)`,
        [p.slug, p.title, excerptFor(p), buildContent(p), seriesId, authorId],
      )
      console.log(`✓ created ${p.slug}`)
      created++
    }
    console.log(dryRun ? `\nDry run: ${created} would be created.` : `\nDone: ${created} created, ${PROJECTS.length - created} already present.`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
