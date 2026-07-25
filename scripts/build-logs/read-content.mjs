// Shared reader for the build-log content tree.
//
//   scripts/build-logs/posts/<slug>.md    post body (markdown + {{snippet:…}})
//   scripts/build-logs/posts/<slug>.css   optional per-post CSS (scoped to .post-body)
//   scripts/build-logs/snippets/<slug>/   index.html + style.css + script.js + meta.json
//
// Post front matter is a small `---` YAML-ish block: only `title`, `excerpt`,
// `series`, `position`, `publishedAt` and `coverImage` are recognised.
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const POSTS_DIR = path.join(HERE, "posts")
export const SNIPPETS_DIR = path.join(HERE, "snippets")

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { meta: {}, body: raw }

  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][A-Za-z0-9_]*):\s*(.*)$/)
    if (!kv) continue
    let value = kv[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    meta[kv[1]] = value
  }
  return { meta, body: raw.slice(match[0].length) }
}

/** All posts, in filename order. */
export function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return []
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => {
      const slug = file.replace(/\.md$/, "")
      const { meta, body } = parseFrontMatter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"))
      const cssPath = path.join(POSTS_DIR, `${slug}.css`)
      return {
        slug,
        title: meta.title ?? slug,
        excerpt: meta.excerpt ?? "",
        series: meta.series ?? null,
        position: meta.position ? Number(meta.position) : 0,
        publishedAt: meta.publishedAt ?? null,
        coverImage: meta.coverImage || null,
        content: body.trim(),
        customCss: fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8").trim() : null,
      }
    })
}

/** All snippets, in directory order. */
export function readSnippets() {
  if (!fs.existsSync(SNIPPETS_DIR)) return []
  return fs
    .readdirSync(SNIPPETS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .map((slug) => {
      const dir = path.join(SNIPPETS_DIR, slug)
      const read = (f) => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), "utf8") : "")
      const meta = fs.existsSync(path.join(dir, "meta.json"))
        ? JSON.parse(read("meta.json"))
        : {}
      return {
        slug,
        title: meta.title ?? slug,
        description: meta.description ?? "",
        html: read("index.html").trim(),
        css: read("style.css").trim(),
        js: read("script.js").trim(),
      }
    })
}

/** Every {{snippet:a|b}} slug referenced by any post — used to catch typos. */
export function referencedSnippetSlugs(posts) {
  const found = new Set()
  const re = /\{\{\s*snippet:([\w-]+(?:\|[\w-]+)*)/g
  for (const post of posts) {
    let m
    while ((m = re.exec(post.content)) !== null) {
      for (const slug of m[1].split("|")) found.add(slug)
    }
  }
  return found
}
