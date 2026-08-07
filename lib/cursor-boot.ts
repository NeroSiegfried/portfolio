/**
 * Shared by the custom cursor (client) and the root layout (server).
 *
 * There is no web API that reports where the pointer is until it produces an
 * input event, so on a hard load (refresh, cold arrival, a slow DB-backed
 * render) the cursor component has nothing to draw and the native arrow sits
 * there until the user happens to move the mouse — the longer the load, the
 * longer it shows.
 *
 * Work around it by remembering the last known position per tab and replaying
 * it from a blocking inline script that runs before the body paints: the native
 * cursor is hidden and the custom one is placed with no JS bundle, no
 * hydration and no event needed. The entry is cleared the moment the pointer
 * leaves the window, so "reloaded with the mouse outside the page" correctly
 * falls back to the native cursor instead of parking a fake one at a stale spot.
 */

export const CURSOR_STORAGE_KEY = "v2:cursor-pos"

/** Beyond this the pointer has probably moved elsewhere — don't trust it. */
export const CURSOR_POS_MAX_AGE_MS = 5 * 60 * 1000

/**
 * Inline, blocking, runs as the first thing in <body>. Deliberately dependency
 * free and wrapped in try/catch — it must never be able to break the document.
 * The frozen-route test mirrors `isFrozenRoute` (lib/frozen-routes.ts); those
 * routes keep the native cursor, so they must not get the scope class.
 */
export const CURSOR_BOOT_SCRIPT = `(function(){try{
if(!window.matchMedia||!matchMedia("(pointer: fine)").matches)return;
var p=location.pathname;
if(p==="/v1"||p.indexOf("/v1/")===0||p==="/control"||p.indexOf("/control/")===0)return;
var raw=sessionStorage.getItem(${JSON.stringify(CURSOR_STORAGE_KEY)});if(!raw)return;
var a=raw.split(","),x=+a[0],y=+a[1],t=+a[2];
if(!isFinite(x)||!isFinite(y)||!isFinite(t))return;
if(Date.now()-t>${CURSOR_POS_MAX_AGE_MS})return;
if(x<0||y<0||x>innerWidth||y>innerHeight)return;
var r=document.documentElement;
r.style.setProperty("--cx",x+"px");
r.style.setProperty("--cy",y+"px");
r.classList.add("v2-cursor-scope");
}catch(e){}})();`
