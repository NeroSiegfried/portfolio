# Route Flows & Dependency Trees

> Last updated: May 2026  
> Use this document to manually debug routing, auth, and API issues across local and production environments.

---

## Table of Contents

1. [URL Structure](#url-structure)
2. [Page Routes](#page-routes)
3. [API Routes](#api-routes)
4. [Auth Flows (Detailed)](#auth-flows-detailed)
5. [Data Dependency Trees](#data-dependency-trees)
6. [Middleware & Redirects](#middleware--redirects)
7. [Environment Variables](#environment-variables)
8. [Common Issues & Debug Checklist](#common-issues--debug-checklist)

---

## URL Structure

### Primary path (always works)

```
https://nerosiegfried.com/           → Portfolio home (app/page.tsx)
https://nerosiegfried.com/blog       → Blog index (app/blog/page.tsx)
https://nerosiegfried.com/blog/[slug] → Blog post (app/blog/[slug]/page.tsx)
https://nerosiegfried.com/blog/features → Features list (app/blog/features/page.tsx)
https://nerosiegfried.com/blog/series/[...slug] → Series view
https://nerosiegfried.com/control    → Admin login (app/control/page.tsx)
https://nerosiegfried.com/control/dashboard → Admin panel
```

### Subdomain (optional alias — redirects to primary path)

```
https://blog.nerosiegfried.com       → 301 → https://nerosiegfried.com/blog
https://blog.nerosiegfried.com/foo   → 301 → https://nerosiegfried.com/blog/foo
```

> **Why redirect instead of rewrite?**  
> Rewrites keep the same URL but serve different content. This breaks cookies (scoped per-hostname), OAuth callback URLs (GitHub/Google registered for `nerosiegfried.com` only), and API routes (a rewrite to `/blog/api/...` 404s). A redirect sends the browser to the canonical URL, keeping everything on one origin.

---

## Page Routes

### `GET /` → `app/page.tsx`
- **Type:** Server Component
- **Data:** No database calls; static content
- **Components:** `<Hero>`, `<About>`, `<Projects>`, `<TechStack>`, `<Contact>`, `<Footer>`
- **Dependencies:** None external

### `GET /blog` → `app/blog/page.tsx`
- **Type:** Server Component (`force-dynamic`)
- **Data:** `readBlogHomeDb()` → PostgreSQL (posts, series, snippets, users)
  - Cached in `global._homeDbCache` with 120s TTL
  - Warmed at startup by `instrumentation.ts`
- **Components:** `<BlogPostList>`, `<BlogArchiveSidebar>`, `<BlogTopNav>`
- **Loading skeleton:** `app/blog/loading.tsx`

### `GET /blog/[slug]` → `app/blog/[slug]/page.tsx`
- **Type:** Server Component (`force-dynamic`)
- **Data:**
  - `readBlogPostDb(slug)` → post, series, snippets cached 120s in `global._postDbCache`
  - Series prev/next computed server-side from `listPublishedPostsForSeries()`
    - Filtered by exact `seriesId`, sorted by `publishedAt` then `createdAt`
- **Components:** `<BlogMarkdown>`, `<BlogSeriesNav>`, `<LazyComments>`, `<PostVoteButton>`
- **Loading skeleton:** `app/blog/[slug]/loading.tsx`
- **Comments:** loaded client-side via `<LazyComments>` → `GET /api/blog/posts/[slug]/comments`

### `GET /blog/features` → `app/blog/features/page.tsx`
- **Data:** `readBlogHomeDb()` (same cache as /blog)

### `GET /blog/series/[...slug]` → `app/blog/series/[...slug]/page.tsx`
- **Data:** `readSeriesDb()` → cached 120s in `global._seriesDbCache`

### `GET /control` → `app/control/page.tsx`
- **Type:** Server Component
- **Auth:** Checks session via `getSessionUser()`. If already logged in, redirects to `/control/dashboard`
- **Components:** `<ControlLoginForm>` (client component)

### `GET /control/dashboard` → `app/control/dashboard/page.tsx`
- **Auth:** `requireAdminUser()` → 401/redirect if not admin
- **Components:** `<AdminDashboard>` (client component)
- **Data:** Various admin API calls from client-side

---

## API Routes

### Auth

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `POST` | `/api/auth/login` | Password login → sets session cookie | No |
| `POST` | `/api/auth/register` | Create account → sets session cookie | No |
| `POST` | `/api/auth/logout` | Clears session cookie + DB row | Yes (session) |
| `GET` | `/api/auth/me` | Returns current user from session | No (returns null if not logged in) |
| `GET` | `/api/auth/oauth/github` | Initiates GitHub OAuth flow | No |
| `GET` | `/api/auth/oauth/github/callback` | GitHub OAuth callback | No |
| `GET` | `/api/auth/oauth/google` | Initiates Google OAuth flow | No |
| `GET` | `/api/auth/oauth/google/callback` | Google OAuth callback | No |

### Blog

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `GET` | `/api/blog/posts/[slug]/comments` | Get comment tree for a post | No |
| `POST` | `/api/blog/comments` | Create a comment | Yes (logged in) |
| `PATCH` | `/api/blog/comments/[id]` | Edit a comment | Yes (owner or admin) |
| `DELETE` | `/api/blog/comments/[id]` | Delete a comment | Yes (owner or admin) |
| `POST` | `/api/blog/comments/vote` | Vote on a comment | Yes (logged in) |
| `POST` | `/api/blog/posts/vote` | Vote on a post | Yes (logged in) |

### Admin

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `GET/POST` | `/api/admin/posts` | List / create posts | Admin |
| `GET/PUT/DELETE` | `/api/admin/posts/[id]` | Manage a post | Admin |
| `GET/POST` | `/api/admin/series` | List / create series | Admin |
| `PUT/DELETE` | `/api/admin/series/[id]` | Manage a series | Admin |
| `GET/POST` | `/api/admin/snippets` | List / create snippets | Admin |
| `PATCH/DELETE` | `/api/admin/snippets/[id]` | Manage a snippet | Admin |
| `POST` | `/api/blog/admin/users/[id]/block` | Block a user | Admin |

---

## Auth Flows (Detailed)

### Password Login (`/control` → dashboard)

```
User visits /control
  └── ControlLoginForm (client)
        └── POST /api/auth/login
              ├── ensureAdminAccountOnDemand()   ← seeds admin if BLOG_ADMIN_EMAIL/PASSWORD set
              ├── SELECT * FROM users WHERE email=$1
              ├── verifyPassword(password, hash)
              ├── INSERT INTO sessions (...)
              ├── setSessionCookie(response, token)  ← httpOnly cookie "portfolio_blog_session"
              └── window.location.href = "/control/dashboard"   ← full navigation (not router.push)
                    └── requireAdminUser() checks cookie → allow
```

> **Local only works if:** `BLOG_ADMIN_EMAIL` and `BLOG_ADMIN_PASSWORD` are set in `.env.local`.  
> These env vars trigger `ensureAdminAccountOnDemand()` to seed the admin row in the database.

### GitHub OAuth

```
User clicks "Login with GitHub" on blog
  └── <BlogComments> links to GET /api/auth/oauth/github?returnTo=/blog/[slug]
        ├── Reads GITHUB_CLIENT_ID (prod) or GITHUB_CLIENT_ID_LOCAL (localhost)
        ├── Builds redirect_uri = baseUrl + /api/auth/oauth/github/callback
        └── 302 → github.com/login/oauth/authorize

GitHub redirects back to /api/auth/oauth/github/callback?code=...&state=...
  ├── Exchanges code for access_token
  ├── Fetches github.com/user + github.com/user/emails
  ├── Upserts user row in DB
  ├── INSERT INTO sessions (...)
  ├── setSessionCookie(response, token)
  └── 302 → returnTo path (e.g. /blog/[slug])
```

> **OAuth works when:** GitHub OAuth App's "Authorization callback URL" is set to  
> `https://nerosiegfried.com/api/auth/oauth/github/callback` (prod)  
> `http://localhost:3000/api/auth/oauth/github/callback` (local, separate App or same App with multiple callbacks)

> **OAuth breaks when:** accessing via `blog.nerosiegfried.com` directly (before redirect)  
> because the callback URL becomes `blog.nerosiegfried.com/api/auth/oauth/github/callback`  
> which is not registered with GitHub. **The subdomain-to-mainpath redirect fixes this.**

### Session Cookie

```
Name:     portfolio_blog_session
httpOnly: true
sameSite: lax
secure:   true (production) / false (development)
path:     /
maxAge:   14 days
domain:   NOT set → scoped to exact hostname only
```

> **Cookie domain:** Not setting a domain means the cookie is only sent to the exact hostname that set it. Since everything now lives on `nerosiegfried.com`, this is fine. If you ever want cross-subdomain cookies, add `domain: ".nerosiegfried.com"` to `setSessionCookie()` in `lib/blog/auth.ts`.

### Admin Account Bootstrapping

```
ensureAdminAccountOnDemand(email, password):
  IF email === BLOG_ADMIN_EMAIL AND password === BLOG_ADMIN_PASSWORD:
    SELECT * FROM users WHERE email=$1
    IF not found:
      INSERT user with role='admin'
```

> If `BLOG_ADMIN_EMAIL`/`BLOG_ADMIN_PASSWORD` are not set, admin account is never auto-created.  
> In that case, you must manually INSERT the admin row in PostgreSQL.

---

## Data Dependency Trees

### Blog Post Page (`/blog/[slug]`)

```
app/blog/[slug]/page.tsx (server)
  ├── readBlogPostDb(slug)               → global._postDbCache (120s TTL)
  │     └── PostgreSQL: posts, series, snippets, users, sessions
  ├── listPublishedPostsForSeries()      → used for series prev/next nav
  │     └── Filters by exact post.seriesId, sorted by publishedAt/createdAt ASC
  └── <LazyComments slug={slug}>         → client component
        └── useEffect → fetch /api/blog/posts/[slug]/comments
              └── readPostCommentsDb(slug) → global._commentsCache (120s TTL)
                    └── PostgreSQL: comments, comment_votes, users
```

### Blog Index (`/blog`)

```
app/blog/page.tsx (server)
  └── readBlogHomeDb()                   → global._homeDbCache (120s TTL)
        └── PostgreSQL: posts, series, snippets, users, sessions
```

### Startup Warmup (`instrumentation.ts`)

```
register() [runs once when Next.js server starts, Node.js runtime only]
  ├── getPool().query("SELECT 1")        → establishes TCP+SSL connection to RDS (expensive cold op)
  ├── readBlogHomeDb()                   → populates global._homeDbCache
  ├── readSeriesDb()                     → populates global._seriesDbCache
  └── for each published slug:
        ├── readBlogPostDb(slug)         → populates global._postDbCache[slug]
        └── readPostCommentsDb(slug)     → populates global._commentsCache[slug]
```

> This warmup takes ~5–30s depending on network latency to RDS. The first request after server start hits cached data. If a request arrives before warmup finishes, it falls through to a live DB query.

---

## Middleware & Redirects

### Request flow (in order)

```
Incoming request
  1. Vercel Edge (vercel.json)
       └── IF host == blog.nerosiegfried.com:
             301 redirect → https://nerosiegfried.com/blog[/path]
  2. Next.js Middleware (middleware.ts)
       └── IF host == blog.nerosiegfried.com (safety net, Vercel should catch this first):
             301 redirect → https://nerosiegfried.com/blog[/path]
       └── IF ADMIN_ENTRY_PATH env set (non-default):
             rewrite custom path → /control
  3. Next.js Router
       └── Routes to appropriate app/.../(page|route).ts
```

### Why two layers?

- **vercel.json** redirects run at the CDN/edge before the serverless function boots — fastest, no cold start
- **middleware.ts** is a safety net for when running locally (`next dev` / `next start`) where vercel.json doesn't apply

---

## Environment Variables

### Required (app won't work without these)

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Server | PostgreSQL connection string (`postgres://user:pass@host:5432/db?sslmode=require`) |
| `NEXT_PUBLIC_SITE_URL` | Build + Server | Canonical origin, e.g. `https://nerosiegfried.com` — used in OAuth callback URLs and redirects |

### Required for Admin Login

| Variable | Where | Description |
|----------|-------|-------------|
| `BLOG_ADMIN_EMAIL` | Server | Email address for auto-seeded admin account |
| `BLOG_ADMIN_PASSWORD` | Server | Password for auto-seeded admin account |

> Without these, `ensureAdminAccountOnDemand()` is a no-op. You must manually create the admin row in PostgreSQL.

### Required for GitHub OAuth

| Variable | Where | Description |
|----------|-------|-------------|
| `GITHUB_CLIENT_ID` | Server | GitHub OAuth App client ID (production) |
| `GITHUB_CLIENT_SECRET` | Server | GitHub OAuth App client secret (production) |
| `GITHUB_CLIENT_ID_LOCAL` | Server | GitHub OAuth App client ID (localhost) |
| `GITHUB_CLIENT_SECRET_LOCAL` | Server | GitHub OAuth App client secret (localhost) |

> GitHub OAuth App callback URLs must be registered:  
> Production: `https://nerosiegfried.com/api/auth/oauth/github/callback`  
> Local: `http://localhost:3000/api/auth/oauth/github/callback`

### Required for Google OAuth

| Variable | Where | Description |
|----------|-------|-------------|
| `GOOGLE_CLIENT_ID` | Server | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Server | Google OAuth client secret |

> Google OAuth redirect URIs must be registered:  
> Production: `https://nerosiegfried.com/api/auth/oauth/google/callback`  
> Local: `http://localhost:3000/api/auth/oauth/google/callback`

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_ENTRY_PATH` | `/control` | Custom URL that rewrites to `/control` (security by obscurity) |

---

## Common Issues & Debug Checklist

### 404 on blog posts / API routes in production

**Cause:** Previously, `vercel.json` used rewrites (not redirects) for `blog.nerosiegfried.com`. Rewrites ran before middleware and intercepted `/api/...` paths, rewriting them to `/blog/api/...` (which doesn't exist).

**Fix applied:** Changed to `redirects` in `vercel.json`. All traffic from `blog.nerosiegfried.com` is now permanently redirected to `nerosiegfried.com/blog/...`.

**Check:**
```bash
curl -I https://blog.nerosiegfried.com/blog-welcome
# Should see: HTTP/2 301 / Location: https://nerosiegfried.com/blog/blog-welcome
```

### OAuth doesn't work in production

**Cause 1:** Accessing via `blog.nerosiegfried.com` → OAuth callback URL becomes `blog.nerosiegfried.com/api/auth/...` which isn't registered with GitHub/Google.

**Fix:** Subdomain now redirects to main domain before OAuth flow starts.

**Cause 2:** `NEXT_PUBLIC_SITE_URL` not set in production environment → `url.origin` used as fallback, which may be the serverless function's internal URL.

**Fix:** Set `NEXT_PUBLIC_SITE_URL=https://nerosiegfried.com` in your hosting environment (Amplify / Vercel).

**Cause 3:** OAuth App callback URL not registered.

**Check:** In GitHub → Settings → Developer settings → OAuth Apps → your app → "Authorization callback URL" must include `https://nerosiegfried.com/api/auth/oauth/github/callback`.

### Comments work locally but 404 in production

**Cause:** API call `GET /api/blog/posts/[slug]/comments` was being rewritten to `/blog/api/...` (no longer applies after fix above).

**Check after fix:**
```bash
curl https://nerosiegfried.com/api/blog/posts/blog-welcome/comments
# Should return JSON with { comments: [...] }
```

### Admin login works in production but not locally

**Cause:** `BLOG_ADMIN_EMAIL` and `BLOG_ADMIN_PASSWORD` environment variables are not set in `.env.local`.

**Fix:** Create `.env.local` at project root:
```env
DATABASE_URL=postgres://...
BLOG_ADMIN_EMAIL=your@email.com
BLOG_ADMIN_PASSWORD=yourpassword
GITHUB_CLIENT_ID_LOCAL=your_local_app_client_id
GITHUB_CLIENT_SECRET_LOCAL=your_local_app_client_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Session cookie not sent / auth fails

**Check:**
- Browser DevTools → Application → Cookies → `nerosiegfried.com`
- Look for `portfolio_blog_session`
- It should be `HttpOnly`, `SameSite=Lax`, `Secure=true` (in prod), `Path=/`
- If cookie is missing after login, check that `setSessionCookie()` in `lib/blog/auth.ts` is being called on the response

### Slow cold start / first request very slow

**Cause:** TCP + SSL handshake to RDS takes 200ms–2s depending on region. `instrumentation.ts` pre-warms the connection and fills all caches at server start.

**Check:** Server logs should show warmup completing within ~30s of startup. First requests after warmup should be <100ms (cached).

**If warm but still slow:** The 120s cache TTL may have expired. TTLs are defined in `lib/blog/store.ts`:
```ts
const HOME_TTL_MS   = 120_000
const SERIES_TTL_MS = 120_000
const POST_TTL_MS   = 120_000
const COMMENTS_TTL_MS = 120_000
```
Increase these values to reduce DB hit frequency.

### Series prev/next navigation is wrong

**Cause (fixed):** `listPublishedPostsForSeries()` returns all posts in a series tree (including sub-series). Page was using all of them for nav without filtering to the exact series.

**Fix applied:** `app/blog/[slug]/page.tsx` filters `seriesPosts` to `p.seriesId === post.seriesId` and sorts by `publishedAt ?? createdAt ASC`.

**Check:** Posts must have `published_at` set in the DB, or at minimum `created_at`. If `published_at` is null on some posts, they'll sort by `created_at` which should still be deterministic.

---

## File Map (Quick Reference)

```
middleware.ts               Request routing (subdomain redirect, admin entry rewrite)
vercel.json                 Vercel CDN redirects (subdomain → mainpath)
next.config.mjs             Next.js config (security headers, image domains)
instrumentation.ts          Server startup: DB pool warm + cache pre-fill

lib/blog/auth.ts            Session cookies, password hashing, user auth helpers
lib/blog/store.ts           DB pool, cache logic, read/write helpers
lib/blog/queries.ts         SQL query helpers (list posts, series, etc.)
lib/blog/types.ts           TypeScript types for DB entities

app/layout.tsx              Root layout (theme provider, global styles)
app/page.tsx                Portfolio home (/, no DB)
app/blog/page.tsx           Blog index (/blog, reads homeDb)
app/blog/[slug]/page.tsx    Blog post (/blog/[slug], reads postDb)
app/blog/features/page.tsx  Features list (/blog/features)
app/blog/series/[...]/      Series view
app/control/page.tsx        Admin login UI
app/control/dashboard/      Admin dashboard

app/api/auth/login/         POST: password login
app/api/auth/register/      POST: user registration
app/api/auth/logout/        POST: logout
app/api/auth/me/            GET: current session user
app/api/auth/oauth/github/  GET: initiate GitHub OAuth
app/api/auth/oauth/github/callback/  GET: GitHub OAuth callback
app/api/auth/oauth/google/  GET: initiate Google OAuth
app/api/auth/oauth/google/callback/  GET: Google OAuth callback

app/api/blog/posts/[slug]/comments/  GET: comment tree for post
app/api/blog/comments/      POST: create comment
app/api/blog/comments/[id]/ PATCH/DELETE: edit/delete comment
app/api/blog/comments/vote/ POST: vote on comment
app/api/blog/posts/vote/    POST: vote on post

app/api/admin/posts/        Admin CRUD for posts
app/api/admin/series/       Admin CRUD for series
app/api/admin/snippets/     Admin CRUD for snippets
app/api/blog/admin/users/[id]/block/  Block a user
```
