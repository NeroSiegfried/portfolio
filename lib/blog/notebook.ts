export function markdownToLines(markdown: string) {
  if (!markdown) return [""]
  return markdown.split("\n")
}

export function linesToMarkdown(lines: string[]) {
  return lines.join("\n")
}
