import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import type { BlogSnippet, PublicUser } from "@/lib/blog/types"
import BlogSnippetEmbed from "@/components/blog-snippet-embed"

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

export default function BlogMarkdown({ markdown, snippetsBySlug, user }: BlogMarkdownProps) {
  const blocks = parseBlocks(markdown)

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
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
                className="my-4 rounded-md border border-dashed p-3 text-sm text-muted-foreground"
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
          >
            {normalizeMarkdownNewlines(block.value)}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}
