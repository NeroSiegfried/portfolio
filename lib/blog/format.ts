/**
 * Pure formatting utilities — NO Node.js imports. Safe for client components.
 */

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"]
  let result = ""
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      result += syms[i]
      n -= vals[i]
    }
  }
  return result
}

/**
 * Formats a 1-based series entry index using a format string.
 *
 * Supported tokens:
 *  {n}     → arabic numeral  (1, 2, 3 …)
 *  {roman} → lowercase roman (i, ii, iii …)
 *  {ROMAN} → uppercase roman (I, II, III …)
 *  {alpha} → lowercase alpha (a, b, c …)
 *  {ALPHA} → uppercase alpha (A, B, C …)
 *
 * Falls back to the bare number when format is null/undefined.
 *
 * Examples: "Project {n}" → "Project 3"
 *           "Chapter {roman}" → "Chapter iii"
 *           "Part {ROMAN}" → "Part IV"
 */
export function formatSeriesEntry(
  format: string | null | undefined,
  index: number
): string {
  const tpl = format ?? "{n}"
  return tpl
    .replace(/\{n\}/g, String(index))
    .replace(/\{ROMAN\}/g, toRoman(index))
    .replace(/\{roman\}/g, toRoman(index).toLowerCase())
    .replace(/\{ALPHA\}/g, String.fromCharCode(64 + Math.min(index, 26)))
    .replace(/\{alpha\}/g, String.fromCharCode(96 + Math.min(index, 26)))
}
