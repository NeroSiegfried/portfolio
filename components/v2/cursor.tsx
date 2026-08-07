"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { isFrozenRoute } from "@/lib/frozen-routes"
import { CURSOR_POS_MAX_AGE_MS, CURSOR_STORAGE_KEY } from "@/lib/cursor-boot"

type Variant = "dot" | "hover" | "ring"

/**
 * Custom cursor (portfoliod): a small filled dot by default, a slightly larger
 * dot over links/buttons, and a large ring with a bold up-right arrow over
 * project media ([data-cursor]). Over media it also shows a trailing label
 * (from `data-cursor-label`, e.g. "Visit site" / "Read build log") that follows
 * the cursor. mix-blend-difference so it inverts over any background. Disabled
 * on touch; native cursor hidden via `.v2-cursor-scope` on <html>.
 *
 * Rendered once, near the top of the root layout's <body>, so it survives
 * client-side navigation instead of remounting (and losing all pointer state)
 * on every page, and so its markup is in the first streamed flush rather than
 * arriving after the page content. Paused on the frozen /v1 site and /control
 * admin via a pathname-driven effect that calls the pause/resume controls the
 * main effect exposes through a ref.
 *
 * Two things make this harder than "follow the mouse", and both are handled
 * explicitly below:
 *
 *  1. Nothing reports the pointer position before its first input event, so on
 *     a hard load we'd otherwise have to show the native cursor until the user
 *     moves. Instead the position is mirrored into sessionStorage and replayed
 *     pre-paint by CURSOR_BOOT_SCRIPT (see lib/cursor-boot.ts).
 *  2. Over a snippet <iframe> the custom cursor hides and the OS cursor takes
 *     over. That swap can't be left to the browser: crossing into or out of a
 *     frame by SCROLLING changes which document owns the pointer without
 *     changing any style, and the cursor icon isn't repainted for that — which
 *     is what left no cursor going in and two coming out. So we decide it
 *     ourselves from our own hit test and write the answer into --v2-cursor on
 *     <html> (an explicit value change the browser does act on), telling the
 *     frame to match via the postMessage channel that already carries
 *     theme/user.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const controlsRef = useRef<{ pause: () => void; resume: () => void } | null>(null)

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dot = dotRef.current
    const label = labelRef.current
    if (!dot || !label) return

    const root = document.documentElement

    let raf = 0
    // Display position (eased) vs. real pointer position (target).
    let x = -100
    let y = -100
    let tx = -100
    let ty = -100
    // Have we ever had a real position? Once true it stays true — the pointer
    // does not stop existing just because the dot is hidden.
    let known = false
    // The dot is drawn unless the pointer is off the window or inside a frame.
    let hidden = false
    // Pointer is outside the document entirely. Kept separate from `hidden`
    // because it's the one state where (tx,ty) is a stale in-window position
    // that must NOT be hit-tested — everything else can and should be polled.
    let offWindow = false
    // The snippet frame the pointer is currently inside, if any.
    let insideFrame: HTMLIFrameElement | null = null
    // False on the frozen /v1 site and /control admin — those keep the native
    // cursor untouched. Toggled by the pathname effect below via controlsRef.
    let active = !isFrozenRoute(pathname)

    const INTERACTIVE = "a, button, [role=button], [data-cursor], input, textarea, select"

    /* ── position persistence ───────────────────────────────────────── */

    let lastPersist = -Infinity
    const persist = () => {
      const now = performance.now()
      if (now - lastPersist < 250) return
      lastPersist = now
      try {
        sessionStorage.setItem(CURSOR_STORAGE_KEY, `${Math.round(tx)},${Math.round(ty)},${Date.now()}`)
      } catch {}
    }
    // Pointer is off the page — on the next load we genuinely don't know where
    // it is, so drop the entry and let the native cursor take over there.
    const forgetPosition = () => {
      try {
        sessionStorage.removeItem(CURSOR_STORAGE_KEY)
      } catch {}
    }

    const restorePosition = () => {
      try {
        const raw = sessionStorage.getItem(CURSOR_STORAGE_KEY)
        if (!raw) return false
        const [sx, sy, st] = raw.split(",").map(Number)
        if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(st)) return false
        if (Date.now() - st > CURSOR_POS_MAX_AGE_MS) return false
        if (sx < 0 || sy < 0 || sx > window.innerWidth || sy > window.innerHeight) return false
        tx = x = sx
        ty = y = sy
        return true
      } catch {
        return false
      }
    }

    /* ── native cursor handoff ──────────────────────────────────────── */

    const frames = () => document.getElementsByTagName("iframe")

    // The whole snippet fix. We do NOT wait for the browser to work out that
    // the pointer is now over (or no longer over) a frame — on a scroll it
    // never does. We work it out from our own hit test and write the cursor we
    // want straight into this document, which is a real computed-value change
    // and therefore does get painted, whichever document the browser currently
    // considers the owner.
    //
    // The browser takes the cursor from whichever document last received real
    // pointer input — and scrolling is not input, so that never changes on a
    // scroll. Move inside a snippet and THAT frame owns the cursor for the
    // whole page until you move somewhere else: over the page, and over other
    // snippets too. So "should a native cursor be showing right now?" is one
    // page-wide question, and every frame has to answer it the same way. Ask
    // only the frame under the pointer and the owner keeps drawing its own
    // stale answer — either an arrow stranded over the page, or nothing at all
    // over a different snippet.
    let nativeWanted = false
    const setNativeCursor = (want: boolean) => {
      if (want === nativeWanted) return
      nativeWanted = want
      // For when this document is the one being asked.
      root.style.setProperty("--v2-cursor", want ? "default" : "none")
      // For when any frame is — including one the pointer isn't in.
      const list = frames()
      for (let i = 0; i < list.length; i++) {
        list[i].contentWindow?.postMessage({ type: "cursor-mode", hide: !want }, "*")
      }
    }

    const enterFrame = (frame: HTMLIFrameElement | null) => {
      if (frame === insideFrame) return
      insideFrame = frame
      setNativeCursor(!!frame)
    }

    /* ── appearance ─────────────────────────────────────────────────── */

    // Hiding the native cursor and drawing the custom one have to happen
    // together — either alone leaves a moment with no usable pointer.
    const revealCustomCursor = () => {
      root.classList.add("v2-cursor-scope")
    }

    const setHidden = (next: boolean) => {
      if (hidden === next) return
      hidden = next
      dot.dataset.hidden = String(next)
      if (next) label.dataset.show = "false"
      // Coming back from hidden: jump to the real position rather than easing
      // in from wherever it was parked. It was invisible, so there is nothing
      // to animate from.
      else {
        x = tx
        y = ty
      }
    }

    let currentKey = ""
    const applyKind = (variant: Variant, text: string) => {
      const key = `${variant}|${text}`
      if (key === currentKey) return
      currentKey = key
      dot.dataset.variant = variant
      if (text) {
        label.textContent = text
        label.dataset.show = "true"
      } else {
        label.dataset.show = "false"
      }
    }

    const applyForElement = (el: HTMLElement | null) => {
      const target = (el?.closest?.(INTERACTIVE) as HTMLElement | null) ?? null
      const isRing = !!target?.hasAttribute("data-cursor")
      applyKind(
        target ? (isRing ? "ring" : "hover") : "dot",
        isRing ? target?.getAttribute("data-cursor-label") ?? "" : "",
      )
    }

    // Single funnel for "what's under the pointer right now", used by every
    // source (mouseover target, mouseout relatedTarget, elementFromPoint,
    // scroll). A null hit test just hides — it deliberately does NOT latch
    // `offWindow`, which only onLeaveWindow sets. elementFromPoint can miss
    // transiently (mid-transition, mid-resize), and since the poll keeps
    // running, hiding alone recovers by itself on the next tick whereas
    // latching would wait for a mouse move.
    const applyForTarget = (el: HTMLElement | null) => {
      if (el === null) {
        enterFrame(null)
        setHidden(true)
        return
      }
      const frame = el.closest?.("iframe") as HTMLIFrameElement | null
      if (frame) {
        // Inside a snippet: our cursor gets out of the way and the OS cursor
        // takes over, so the demo behaves like an ordinary page.
        enterFrame(frame)
        setHidden(true)
        return
      }
      enterFrame(null)
      setHidden(false)
      applyForElement(el)
    }

    const resolveAt = (px: number, py: number) => {
      applyForTarget(document.elementFromPoint(px, py) as HTMLElement | null)
    }

    /* ── first-paint bootstrap ──────────────────────────────────────── */

    // Only attempted once, for the very first reveal after mount, and only if
    // the persisted position didn't already give us one.
    let hoverBootstrapActive = true
    let hoverBootstrapDeadline = 0

    const tryHoverBootstrap = (now: number) => {
      if (hoverBootstrapDeadline === 0) hoverBootstrapDeadline = now + 2000
      if (now > hoverBootstrapDeadline) {
        hoverBootstrapActive = false
        return
      }
      // Native :hover is computed from real hit-testing rather than from the
      // DOM mouse-event stream, so where it's populated it can tell us which
      // element the pointer is over before any event fires. It gives no
      // coordinates, so approximate with the element's centre; the first real
      // move corrects it as an instant snap.
      const hovered = document.querySelectorAll(":hover")
      const deepest = hovered[hovered.length - 1] as HTMLElement | undefined
      if (!deepest) return
      const rect = deepest.getBoundingClientRect()
      tx = x = rect.left + rect.width / 2
      ty = y = rect.top + rect.height / 2
      known = true
      hoverBootstrapActive = false
      revealCustomCursor()
      applyForTarget(deepest)
      persist()
    }

    /* ── events ─────────────────────────────────────────────────────── */

    const ensureKnown = () => {
      if (known) return
      known = true
      hoverBootstrapActive = false
      // Snap the rendered position too, not just the target — otherwise the
      // dot eases in from off-screen over several frames instead of just
      // appearing where the pointer already is.
      x = tx
      y = ty
      revealCustomCursor()
    }

    // Position tracking continues while paused (so returning from /v1 resumes
    // at the right place); only the rendering is gated on `active`.
    const adoptPosition = (px: number, py: number) => {
      tx = px
      ty = py
      offWindow = false
      persist()
      if (!active) return
      const wasKnown = known
      ensureKnown()
      // A mousemove in THIS document while we think we're in a frame means the
      // pointer just left it — re-resolve rather than assume.
      if (!wasKnown || insideFrame) resolveAt(tx, ty)
      else setHidden(false)
    }

    const onMove = (e: MouseEvent) => adoptPosition(e.clientX, e.clientY)

    // Hover (not movement) drives the variant/label swap, via delegated
    // mouseover/mouseout so entering/leaving nested children of the same
    // interactive ancestor doesn't flicker.
    const onOver = (e: MouseEvent) => {
      if (!active) return
      applyForTarget(e.target as HTMLElement)
    }

    // relatedTarget is null when the pointer leaves the document — but just as
    // often when a hovered element is torn down and replaced in place (a
    // re-rendered nav link) with nothing under the pointer actually changing.
    // Re-hit-test on the next frame instead of trusting the instant: real
    // content still there resolves back to the same element, and a genuine
    // window exit is caught by onLeaveWindow anyway.
    const onOut = (e: MouseEvent) => {
      if (!active) return
      const related = e.relatedTarget as HTMLElement | null
      if (related) {
        applyForTarget(related)
        return
      }
      requestAnimationFrame(() => {
        if (!active) return
        resolveAt(tx, ty)
      })
    }

    // mouseleave/mouseenter on <html> fire only for the real window boundary —
    // a snippet iframe is a descendant, so moving onto one does not trigger
    // them. This is the one case where the dot must hide and stay hidden.
    const onLeaveWindow = () => {
      offWindow = true
      enterFrame(null)
      forgetPosition()
      if (!active) return
      setHidden(true)
    }
    const onEnterWindow = (e: MouseEvent) => adoptPosition(e.clientX, e.clientY)

    // Scrolling is the case the browser gives us nothing for: content moves
    // under a stationary pointer, so no mouse event fires at all. Flag it and
    // let the rAF loop re-resolve on the very next frame, so entering/leaving
    // a snippet by scroll swaps the cursor when it would if you'd moved the
    // mouse — but at most one hit test per frame rather than one per scroll
    // event (elementFromPoint forces layout, and scroll events outpace
    // frames). Capture, to catch nested scrollers too.
    let forceSync = false
    const onScroll = () => {
      forceSync = true
    }

    // Scrolling is not the only way content moves under a stationary pointer,
    // and on this site it isn't even the common one: snippet <iframe>s are
    // lazy-loaded, so after a long scroll they keep loading and jumping from
    // their placeholder height to their real one (with a height transition on
    // top) for around a second AFTER the scroll has stopped. Late-loading
    // images do the same. Watching only scroll left the cursor resolving
    // against a layout that had already moved on, which is what made distant
    // snippets feel like they hadn't "loaded" a cursor yet.
    const onLayoutShift = () => {
      forceSync = true
    }
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(onLayoutShift) : null
    resizeObserver?.observe(document.body)

    // Snippet frames report the pointer while it's inside them. The dot stays
    // hidden — this is only so (tx,ty) doesn't go stale, which would make every
    // later hit test (including the one that detects leaving) probe the point
    // where the pointer entered rather than where it actually is.
    let lastSource: Window | null = null
    let lastFrame: HTMLIFrameElement | null = null
    const frameFor = (source: Window | null): HTMLIFrameElement | null => {
      if (!source) return null
      if (source === lastSource && lastFrame?.isConnected) return lastFrame
      const list = frames()
      for (let i = 0; i < list.length; i++) {
        if (list[i].contentWindow === source) {
          lastSource = source
          lastFrame = list[i]
          return list[i]
        }
      }
      return null
    }

    const onMessage = (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data !== "object") return
      // A snippet just changed height — everything below it moves, including
      // possibly out from under the pointer. Re-resolve on the next frame.
      if (data.type === "snippet-resize") {
        forceSync = true
        return
      }
      if (data.type !== "snippet-cursor") return
      const frame = frameFor(e.source as Window | null)
      if (!frame) return
      const fx = Number(data.x)
      const fy = Number(data.y)
      if (!Number.isFinite(fx) || !Number.isFinite(fy)) return
      // Frame-local client coords → our viewport coords.
      const rect = frame.getBoundingClientRect()
      tx = rect.left + fx
      ty = rect.top + fy
      offWindow = false
      persist()
      if (!active) return
      // Authoritative entry signal: a pointer that starts inside the frame, or
      // moves within it, produces no event in this document at all.
      ensureKnown()
      enterFrame(frame)
      setHidden(true)
    }

    /* ── loop ───────────────────────────────────────────────────────── */

    // Content can change under an already-stationary pointer — a page load, a
    // route swap, an image shifting layout — none of which fire a native
    // mouseover/mouseout. Poll (cheaply, throttled) what's actually under the
    // real pointer so styling never waits for a physical move. Hit-tests the
    // real target (tx,ty), not the eased display position (x,y), which lags
    // several frames behind after a jump.
    let lastSync = -Infinity
    const SYNC_INTERVAL = 150

    const loop = (now: number) => {
      if (active) {
        if (!known && hoverBootstrapActive) tryHoverBootstrap(now)
        const ease = reduce ? 1 : 0.2
        x += (tx - x) * ease
        y += (ty - y) * ease
        dot.style.setProperty("--cx", `${x}px`)
        dot.style.setProperty("--cy", `${y}px`)
        label.style.setProperty("--cx", `${x}px`)
        label.style.setProperty("--cy", `${y}px`)
        // Deliberately runs while `hidden` too: a snippet scrolling out from
        // under a stationary pointer fires no mouse event, so gating the poll
        // on visibility is what made the dot wait for a move. Only `offWindow`
        // is excluded, where (tx,ty) is stale.
        if (known && !offWindow && (forceSync || now - lastSync > SYNC_INTERVAL)) {
          forceSync = false
          lastSync = now
          resolveAt(tx, ty)
        }
      }
      raf = requestAnimationFrame(loop)
    }

    controlsRef.current = {
      pause: () => {
        if (!active) return
        active = false
        setHidden(true)
        // Leave nothing latched: every frame back to drawing its own cursor,
        // and without the scope class this document is back to the native one.
        setNativeCursor(true)
        insideFrame = null
        root.style.removeProperty("--v2-cursor")
        root.classList.remove("v2-cursor-scope")
      },
      resume: () => {
        if (active) return
        active = true
        if (!known || offWindow) return
        // tx/ty kept tracking while paused, so this is the live position.
        x = tx
        y = ty
        revealCustomCursor()
        resolveAt(tx, ty)
      },
    }

    // Replay the position the boot script already used to hide the native
    // cursor pre-paint, so the dot is correct on the very first frame with no
    // event of any kind.
    if (active && restorePosition()) {
      known = true
      hoverBootstrapActive = false
      revealCustomCursor()
      resolveAt(tx, ty)
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseover", onOver)
    window.addEventListener("mouseout", onOut)
    window.addEventListener("message", onMessage)
    window.addEventListener("scroll", onScroll, { capture: true, passive: true })
    // Capture phase: `load` doesn't bubble, so this is how we hear about images
    // and iframes finishing — each one can reflow the page under the pointer.
    window.addEventListener("load", onLayoutShift, true)
    root.addEventListener("mouseleave", onLeaveWindow)
    root.addEventListener("mouseenter", onEnterWindow)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseover", onOver)
      window.removeEventListener("mouseout", onOut)
      window.removeEventListener("message", onMessage)
      window.removeEventListener("scroll", onScroll, { capture: true })
      window.removeEventListener("load", onLayoutShift, true)
      resizeObserver?.disconnect()
      root.removeEventListener("mouseleave", onLeaveWindow)
      root.removeEventListener("mouseenter", onEnterWindow)
      cancelAnimationFrame(raf)
      root.classList.remove("v2-cursor-scope")
      root.style.removeProperty("--v2-cursor")
      controlsRef.current = null
    }
    // Mount-only: `pathname` is read once to seed `active`; later changes go
    // through the pause/resume effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isFrozenRoute(pathname)) controlsRef.current?.pause()
    else controlsRef.current?.resume()
  }, [pathname])

  return (
    <>
      <div ref={dotRef} className="v2-cursor" data-variant="dot" aria-hidden>
        {/* Tight viewBox so the arrow fills the box; sharp (miter/square) edges;
            stroke width tuned to read as regular weight at ~98px and match the ring. */}
        <svg viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M5 1H17V13" />
          <path d="M1 17 17 1" />
        </svg>
      </div>
      <div ref={labelRef} className="v2-cursor-label" data-show="false" aria-hidden />
    </>
  )
}
