// Render every snippet in scripts/build-logs/snippets/ exactly the way
// components/blog-snippet-embed.tsx does (same THEME_RESET, same srcdoc shape,
// same sandbox) and screenshot each one, light and dark.
//
//   node scripts/preview-snippets.mjs                 # all snippets
//   node scripts/preview-snippets.mjs pengana-showcase [...]
//
// Output: scripts/.preview/<slug>-<theme>.png  (gitignored scratch)
import puppeteer from "puppeteer"
import fs from "fs"
import path from "path"
import { readSnippets } from "./build-logs/read-content.mjs"

const OUT = path.resolve("scripts/.preview")
const WIDTH = Number(process.env.WIDTH ?? 760)

// Kept in sync with components/blog-snippet-embed.tsx.
const THEME_RESET = `
:root {
  --sn-bg:#f7f8fc;--sn-fg:#1a1a1a;--sn-primary:#4f8cff;--sn-primary-fg:#fff;
  --sn-secondary:#ff6b2b;--sn-muted:#e4e7f0;--sn-muted-fg:#666;
  --sn-border:#e0e3ee;--sn-radius:0.5rem;
}
[data-theme="dark"]{
  --sn-bg:#1a1a1a;--sn-fg:#f0f4ff;--sn-primary:#4f8cff;--sn-primary-fg:#fff;
  --sn-secondary:#ff6b2b;--sn-muted:#23263a;--sn-muted-fg:#a6a6a6;
  --sn-border:#2a3040;--sn-radius:0.5rem;
}
*,*::before,*::after{box-sizing:border-box;}
html,body{margin:0;min-height:0!important;height:auto!important;
  background:var(--sn-bg);color:var(--sn-fg);
  transition:background 0.25s ease,color 0.25s ease;}
`

function srcDoc(snippet, theme) {
  return `<!doctype html>
<html data-theme="${theme}">
  <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>${THEME_RESET}${snippet.css}</style></head>
  <body>
    ${snippet.html}
    <script>window.__sn_user=null;</script>
    <script>try{
${snippet.js}
    }catch(e){document.title='SNIPPET ERROR: '+e.message;console.error(e)}<\/script>
  </body>
</html>`
}

const only = new Set(process.argv.slice(2))
const snippets = readSnippets().filter((s) => only.size === 0 || only.has(s.slug))
if (!snippets.length) {
  console.error("no snippets matched")
  process.exit(1)
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] })
let failures = 0

for (const snippet of snippets) {
  for (const theme of ["light", "dark"]) {
    const page = await browser.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e)))
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
    await page.setViewport({ width: WIDTH, height: 900, deviceScaleFactor: 2 })
    await page.setContent(srcDoc(snippet, theme), { waitUntil: "load" })
    await new Promise((r) => setTimeout(r, 700))

    const height = await page.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height))
    await page.setViewport({ width: WIDTH, height: Math.max(80, height), deviceScaleFactor: 2 })
    await new Promise((r) => setTimeout(r, 250))
    await page.screenshot({ path: path.join(OUT, `${snippet.slug}-${theme}.png`) })

    const title = await page.title()
    const bad = errors.length > 0 || title.startsWith("SNIPPET ERROR")
    if (bad) failures++
    console.log(`${bad ? "✗" : "✓"} ${snippet.slug} (${theme}) ${height}px${bad ? " — " + (errors[0] ?? title) : ""}`)
    await page.close()
  }
}

await browser.close()
console.log(`\n${snippets.length} snippets → ${OUT}${failures ? ` (${failures} with errors)` : ""}`)
process.exit(failures ? 1 : 0)
