"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import type { PublicUser } from "@/lib/blog/types"

export interface SnippetTab {
  label: string
  html: string
  css: string
  js: string
}

interface BlogSnippetEmbedProps {
  tabs: SnippetTab[]
  wide?: boolean
  showTabs?: boolean
  minHeight?: number
  user?: PublicUser | null
}

const DEFAULT_HEIGHT = 240

// CSS injected before every snippet's own CSS.
// - Resets body min-height to prevent 100vh ResizeObserver feedback loops.
// - Exposes --sn-* design tokens that snippets can opt into.
const THEME_RESET = `
:root {
  --sn-bg:#f7f6f2;--sn-fg:#0a0a0a;--sn-primary:#fb460d;--sn-primary-fg:#fff;
  --sn-secondary:#ebe8e2;--sn-muted:#ebe8e2;--sn-muted-fg:#69645e;
  --sn-card:#fff;--sn-border:#e1ded8;--sn-radius:0;
}
[data-theme="dark"]{
  --sn-bg:#0d0d0d;--sn-fg:#f5f5f5;--sn-primary:#fb460d;--sn-primary-fg:#fff;
  --sn-secondary:#242424;--sn-muted:#242424;--sn-muted-fg:#a3a3a3;
  --sn-card:#171717;--sn-border:#292929;--sn-radius:0;
}
*,*::before,*::after{box-sizing:border-box;}
/* Kill any min-height:100vh that would cause resize feedback */
html,body{margin:0;min-height:0!important;height:auto!important;
  background:var(--sn-bg);color:var(--sn-fg);
  transition:background 0.25s ease,color 0.25s ease;}
`

// Script injected into every iframe.
const IFRAME_SCRIPT = `
(function(){
  // Receive theme-change and user-change from host
  window.addEventListener('message',function(e){
    if(!e.data) return;
    if(e.data.type==='theme-change'){
      document.documentElement.dataset.theme=e.data.theme||'light';
    }
    if(e.data.type==='user-change'){
      window.__sn_user=e.data.user||null;
      document.dispatchEvent(new CustomEvent('sn:userchange',{detail:window.__sn_user}));
    }
  });

  // Debounced auto-height: measure rendered body height, not scroll height
  var _rt=null;
  function reportHeight(){
    var h=Math.ceil(document.body.getBoundingClientRect().height)||60;
    window.parent.postMessage({type:'snippet-resize',height:h},'*');
  }
  window.addEventListener('load',function(){setTimeout(reportHeight,0);});
  if(typeof ResizeObserver!=='undefined'){
    new ResizeObserver(function(){
      clearTimeout(_rt);_rt=setTimeout(reportHeight,50);
    }).observe(document.body);
  }
})();
`

function buildSrcDoc(tab: SnippetTab, theme: string, user: PublicUser | null) {
  const userJson = user
    ? JSON.stringify({ id: user.id, username: user.username, role: user.role })
    : "null"
  return `<!doctype html>
<html data-theme="${theme}">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <style>${THEME_RESET}${tab.css}</style>
  </head>
  <body>
    ${tab.html}
    <script>
      window.__sn_user=${userJson};
      ${IFRAME_SCRIPT}
      (function(){
        var _loopGuard = setTimeout(function(){
          document.body.innerHTML = '<div style="padding:1rem;font-family:sans-serif;color:#c00;font-size:0.85rem">[Snippet stopped: possible infinite loop or long-running script]</div>';
        }, 15000);
        // The newlines matter: a snippet whose JS ends in a // comment would
        // otherwise swallow the closing brace and fail to parse.
        try{
${tab.js}
        }catch(e){console.error('[snippet error]', e);}
        clearTimeout(_loopGuard);
      })();
    <\/script>
  </body>
</html>`
}

export default function BlogSnippetEmbed({
  tabs,
  wide = false,
  showTabs,
  minHeight,
  user = null,
}: BlogSnippetEmbedProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [height, setHeight] = useState(minHeight ?? DEFAULT_HEIGHT)
  const [mounted, setMounted] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { resolvedTheme } = useTheme()

  const theme = mounted ? (resolvedTheme ?? "light") : "light"

  useEffect(() => setMounted(true), [])

  // Auto-size: listen for height reports from this specific iframe
  useEffect(() => {
    if (!mounted) return
    setHeight(minHeight ?? DEFAULT_HEIGHT)

    function onMessage(event: MessageEvent) {
      if (
        event.data?.type === "snippet-resize" &&
        iframeRef.current &&
        event.source === iframeRef.current.contentWindow
      ) {
        const h = Number(event.data.height)
        if (h > 0) setHeight(Math.max(h, minHeight ?? 0))
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [activeIndex, mounted])

  // Broadcast theme changes to loaded iframes (no reload needed)
  useEffect(() => {
    if (!mounted) return
    iframeRef.current?.contentWindow?.postMessage({ type: "theme-change", theme }, "*")
  }, [theme, mounted])

  // Broadcast user changes to loaded iframes (no reload needed)
  useEffect(() => {
    if (!mounted) return
    iframeRef.current?.contentWindow?.postMessage({ type: "user-change", user }, "*")
  }, [user, mounted])

  const displayTabs = tabs.length > 1 && showTabs !== false
  const activeTab = tabs[activeIndex]

  // Snippets use the same square, ruled frame as the v2 portfolio.
  const outerClass = wide ? "my-8 snippet-breakout" : "my-8 border border-border overflow-hidden"
  const innerClass = wide ? "border border-border overflow-hidden" : ""

  return (
    <div className={`not-prose ${outerClass}`}>
      <div className={innerClass}>
        {displayTabs && (
          <div className="flex items-center border-b border-border/60 bg-muted/30 px-3">
            {tabs.map((tab, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
                  i === activeIndex
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {mounted ? (
          <iframe
            ref={iframeRef}
            key={activeIndex}
            title={activeTab.label}
            sandbox="allow-scripts allow-pointer-lock"
            srcDoc={buildSrcDoc(activeTab, theme, user)}
            style={{ height: `${height}px` }}
            // `block` removes the 4px inline descender gap that causes bottom spacing
            className="block w-full transition-[height] duration-150"
            loading="lazy"
          />
        ) : (
          <div
            style={{ height: `${DEFAULT_HEIGHT}px` }}
            className="block w-full animate-pulse bg-muted/40"
          />
        )}
      </div>
    </div>
  )
}
