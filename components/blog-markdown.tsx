import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import type { Element } from "hast"
import type { BlogSnippet, PublicUser } from "@/lib/blog/types"
import BlogSnippetEmbed from "@/components/blog-snippet-embed"
import { cn } from "@/lib/utils"

/**
 * Converts isolated single newlines (soft breaks) to double newlines so
 * each line the author writes becomes its own paragraph in React Markdown.
 * Code blocks (fenced and inline) are preserved verbatim.
 */
function normalizeMarkdownNewlines(raw: string): string {
  const preserved: string[] = []

  // Preserve fenced code blocks
  let text = raw.replace(/```[\s\S]*?```/g, (match) => {
    preserved.push(match)
    return `\x00P${preserved.length - 1}\x00`
  })

  // Preserve GFM tables. Their rows must remain separated by single newlines
  // or remark-gfm reads each row as an ordinary paragraph.
  const lines = text.split("\n")
  const tableDelimiter =
    /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/
  const withTablesPreserved: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const header = lines[i]
    const delimiter = lines[i + 1]

    if (header.includes("|") && delimiter && tableDelimiter.test(delimiter)) {
      const tableLines = [header, delimiter]
      let next = i + 2

      while (
        next < lines.length &&
        lines[next].trim() !== "" &&
        lines[next].includes("|")
      ) {
        tableLines.push(lines[next])
        next++
      }

      preserved.push(tableLines.join("\n"))
      withTablesPreserved.push(`\x00P${preserved.length - 1}\x00`)
      i = next - 1
      continue
    }

    withTablesPreserved.push(header)
  }

  text = withTablesPreserved.join("\n")

  // Preserve inline code
  text = text.replace(/`[^`\n]+`/g, (match) => {
    preserved.push(match)
    return `\x00P${preserved.length - 1}\x00`
  })

  // Convert every isolated single newline to a paragraph break
  text = text.replace(/(?<!\n)\n(?!\n)/g, "\n\n")

  // Restore preserved segments
  text = text.replace(/\x00P(\d+)\x00/g, (_, i) => preserved[parseInt(i)])

  return text
}

interface BlogMarkdownProps {
  markdown: string
  snippetsBySlug: Map<string, BlogSnippet>
  user?: PublicUser | null
}

// ── In-body images ───────────────────────────────────────────────────────────
//
// Authors write plain markdown; the extras ride on parts of the syntax that are
// otherwise unused, so the URL itself stays untouched (lib/blog/media.ts scans
// post content for CloudFront URLs to drive media GC — a modified URL would
// orphan the object).
//
//   ![alt](url)                 image at the reading measure
//   ![alt](url "A caption")     … with a caption under it
//   ![alt|wide](url)            breaks out to the full reading column
//   ![a](url) ![b](url)         two on one line → responsive side-by-side pair
//
// Flags live after a `|` in the alt text, mirroring the `{{snippet:a|b}}`
// convention already used above, and are stripped before the alt is emitted.

const IMAGE_FLAGS = new Set(["wide"])

function parseAlt(raw: string): { alt: string; wide: boolean } {
  const parts = raw.split("|")
  const flags = new Set<string>()
  while (parts.length > 1 && IMAGE_FLAGS.has(parts[parts.length - 1].trim())) {
    flags.add(parts.pop()!.trim())
  }
  return { alt: parts.join("|").trim(), wide: flags.has("wide") }
}

/** The `<img>` elements directly inside a paragraph node. */
function imagesIn(node: Element | undefined): Element[] {
  if (!node) return []
  return node.children.filter(
    (c): c is Element => c.type === "element" && c.tagName === "img",
  )
}

type Block =
  | { type: "markdown"; value: string }
  | { type: "snippet"; slugs: string[]; wide: boolean; notabs: boolean; minHeight?: number }

function codeRanges(markdown: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  const fenced = /```[\s\S]*?```/g
  let m: RegExpExecArray | null
  while ((m = fenced.exec(markdown)) !== null) {
    ranges.push([m.index, m.index + m[0].length])
  }
  const inline = /`[^`\n]+`/g
  while ((m = inline.exec(markdown)) !== null) {
    ranges.push([m.index, m.index + m[0].length])
  }
  return ranges
}

function isInsideCode(pos: number, ranges: Array<[number, number]>) {
  return ranges.some(([s, e]) => pos >= s && pos < e)
}

function parseBlocks(markdown: string): Block[] {
  const ranges = codeRanges(markdown)
  const snippetRegex =
    /\{\{\s*snippet:([\w-]+(?:\|[\w-]+)*)((?:\s+(?:wide|notabs|height:\d+))*)\s*\}\}/g
  const blocks: Block[] = []

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = snippetRegex.exec(markdown)) !== null) {
    if (isInsideCode(match.index, ranges)) continue

    const index = match.index
    if (index > lastIndex) {
      blocks.push({ type: "markdown", value: markdown.slice(lastIndex, index) })
    }

    const flags = match[2] ?? ""
    const heightMatch = flags.match(/height:(\d+)/)
    blocks.push({
      type: "snippet",
      slugs: match[1].split("|"),
      wide: flags.includes("wide"),
      notabs: flags.includes("notabs"),
      minHeight: heightMatch ? parseInt(heightMatch[1], 10) : undefined,
    })

    lastIndex = snippetRegex.lastIndex
  }

  if (lastIndex < markdown.length) {
    blocks.push({ type: "markdown", value: markdown.slice(lastIndex) })
  }

  return blocks
}

const markdownComponents: Components = {
  /**
   * Images render as `<figure>`, which may not sit inside a `<p>`, so any
   * paragraph containing one becomes a figure row instead. The row — not the
   * figure — is the element that carries the layout classes, because the
   * reading measure is applied to direct children of `.prose`
   * (`.post-body--column > .prose > *`), which is what the row is.
   */
  p({ node, children, ...props }) {
    const images = imagesIn(node)
    if (images.length === 0) return <p {...props}>{children}</p>

    const wide = images.some((img) => parseAlt(String(img.properties?.alt ?? "")).wide)
    return (
      <div
        className={cn(
          "post-figure-row",
          images.length > 1 && "post-figure-row--split",
          wide && "snippet-breakout post-figure-row--wide",
        )}
      >
        {children}
      </div>
    )
  },

  img({ node: _node, src, alt, title, ...props }) {
    const { alt: cleanAlt } = parseAlt(alt ?? "")
    const caption = title?.trim()
    return (
      <figure className="post-figure">
        {/* Plain <img>: markdown carries no intrinsic dimensions and next/image
            requires them. Uploads are already downscaled + re-encoded in the
            browser (lib/compress-image.ts) and served immutable via CloudFront. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={cleanAlt} loading="lazy" decoding="async" {...props} />
        {caption ? <figcaption>{caption}</figcaption> : null}
      </figure>
    )
  },
}

export default function BlogMarkdown({ markdown, snippetsBySlug, user }: BlogMarkdownProps) {
  const blocks = parseBlocks(markdown)

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none break-words">
      {blocks.map((block, index) => {
        if (block.type === "snippet") {
          const tabs = block.slugs
            .map((slug) => {
              const s = snippetsBySlug.get(slug)
              if (!s) return null
              return { label: s.title, html: s.html, css: s.css, js: s.js }
            })
            .filter(Boolean) as { label: string; html: string; css: string; js: string }[]

          if (tabs.length === 0) {
            return (
              <div
                key={`missing-${index}`}
                className="my-4 border border-dashed p-3 text-sm text-muted-foreground"
              >
                Snippet not found: <code>{block.slugs.join(", ")}</code>
              </div>
            )
          }

          return (
            <BlogSnippetEmbed
              key={`snippet-${index}`}
              tabs={tabs}
              wide={block.wide}
              showTabs={block.notabs ? false : undefined}
              minHeight={block.minHeight}
              user={user ?? null}
            />
          )
        }

        return (
          <ReactMarkdown
            key={`md-${index}`}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {normalizeMarkdownNewlines(block.value)}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}
