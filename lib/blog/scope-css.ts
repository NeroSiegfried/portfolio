/**
 * Scopes a CSS string so all selectors are prefixed with `scope`.
 *
 * Examples (scope = ".post-body"):
 *   p { … }              →  .post-body p { … }
 *   :root { … }          →  .post-body { … }
 *   h1, h2 { … }         →  .post-body h1, .post-body h2 { … }
 *   @media (…) { p{} }  →  @media (…) { .post-body p {} }
 *   @keyframes foo { }   →  (untouched)
 */
export function scopePostCss(rawCss: string, scope = ".post-body"): string {
  // Strip block comments
  const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "")
  return processRules(css, scope).trim()
}

function processRules(css: string, scope: string): string {
  const result: string[] = []
  let i = 0

  while (i < css.length) {
    // Skip leading whitespace between rules
    if (/\s/.test(css[i])) {
      i++
      continue
    }

    if (css[i] === "@") {
      // --- at-rule ---
      const semiEnd = css.indexOf(";", i)
      const blockStart = css.indexOf("{", i)

      if (semiEnd !== -1 && (blockStart === -1 || semiEnd < blockStart)) {
        // At-rule with no block: @import, @charset, @namespace
        result.push(css.slice(i, semiEnd + 1))
        i = semiEnd + 1
        continue
      }

      if (blockStart === -1) break

      const atKeyword = css.slice(i, blockStart).trim()
      const closingBrace = findClosingBrace(css, blockStart)

      const inner = css.slice(blockStart + 1, closingBrace)
      const atLower = atKeyword.toLowerCase()

      if (
        atLower.startsWith("@keyframes") ||
        atLower.startsWith("@font-face") ||
        atLower.startsWith("@charset") ||
        atLower.startsWith("@import") ||
        atLower.startsWith("@namespace") ||
        atLower.startsWith("@counter-style")
      ) {
        // Leave untouched
        result.push(`${atKeyword} {${inner}}`)
      } else {
        // @media, @supports, @layer, etc. — recurse into inner rules
        result.push(`${atKeyword} {\n${processRules(inner, scope)}\n}`)
      }

      i = closingBrace + 1
    } else {
      // --- regular rule: selector { declarations } ---
      const blockStart = css.indexOf("{", i)
      if (blockStart === -1) break

      const selectorStr = css.slice(i, blockStart).trim()
      const closingBrace = findClosingBrace(css, blockStart)
      const declarations = css.slice(blockStart, closingBrace + 1)

      const scopedSelector = prefixSelectors(selectorStr, scope)
      result.push(`${scopedSelector} ${declarations}`)

      i = closingBrace + 1
    }
  }

  return result.join("\n")
}

/** Returns the index of the } that closes the block opened at `openIdx`. */
function findClosingBrace(css: string, openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}") {
      depth--
      if (depth === 0) return i
    }
  }
  return css.length - 1
}

function prefixSelectors(selectorStr: string, scope: string): string {
  return selectorStr
    .split(",")
    .map((s) => {
      s = s.trim()
      if (!s) return ""
      if (s === ":root") return scope
      if (s.startsWith(":root ")) return `${scope} ${s.slice(6).trim()}`
      // Already scoped (prevents double-scoping on re-render)
      if (s.startsWith(scope)) return s
      return `${scope} ${s}`
    })
    .filter(Boolean)
    .join(",\n")
}
