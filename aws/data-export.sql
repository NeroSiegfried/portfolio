-- USERS
INSERT INTO users (id,username,email,password_hash,role,blocked,created_at,updated_at) VALUES ('u_author','Nero','demo.author@nerosiegfried.dev','seed_only:not_for_login','user',false,'2026-03-01T08:00:00.000Z','2026-03-01T08:00:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id,username,email,password_hash,role,blocked,created_at,updated_at) VALUES ('u_reader_1','Kairo','kairo.reader@example.com','seed_only:not_for_login','user',false,'2026-03-05T10:00:00.000Z','2026-03-05T10:00:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id,username,email,password_hash,role,blocked,created_at,updated_at) VALUES ('u_reader_2','Mina','mina.reader@example.com','seed_only:not_for_login','user',false,'2026-03-06T10:00:00.000Z','2026-03-06T10:00:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id,username,email,password_hash,role,blocked,created_at,updated_at) VALUES ('e840a905-46a8-443e-8942-a0035f826b64','NeroSiegfried','victornabasu@yahoo.com','d5c78f134befa93d3f5932ec6da10159:02f7842c611f7f0a6ccbc51bc4fd4ebcf37d7bfe03442906641121e1bfa2d9e7','user',false,'2026-04-28T02:50:35.735Z','2026-04-28T02:50:35.735Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id,username,email,password_hash,role,blocked,created_at,updated_at) VALUES ('fa1e0324-4d75-476c-92f1-7f1acbfd61fa','admin','admin@example.com','34fc49dfc782b643e9337f1d270f637f:92ef73906c5cbbb53db59503bc537abb764adb33ede00ef3134efd6d1d6265bb','admin',false,'2026-04-28T05:32:02.701Z','2026-04-28T05:32:02.701Z') ON CONFLICT (id) DO NOTHING;
-- SESSIONS
INSERT INTO sessions (id,user_id,token,expires_at,created_at) VALUES ('aeab8ab5-a356-4ee5-8c77-43a63afe5d62','e840a905-46a8-443e-8942-a0035f826b64','9c229bdfa7caa01052fe8a329c3c9c03782c6f556a6b3accd790894b8d2df441','2026-05-12T02:50:35.735Z','2026-04-28T02:50:35.735Z') ON CONFLICT (token) DO NOTHING;
INSERT INTO sessions (id,user_id,token,expires_at,created_at) VALUES ('6f62dd00-2d75-4f1d-8fb3-f8c3e7504c85','e840a905-46a8-443e-8942-a0035f826b64','0094a9ffc6358fc2fa5b44c7d29a55fd11ca3611f32d14e5a01744ccec264447','2026-05-12T05:26:16.907Z','2026-04-28T05:26:16.907Z') ON CONFLICT (token) DO NOTHING;
INSERT INTO sessions (id,user_id,token,expires_at,created_at) VALUES ('d4019655-421a-496a-869b-36032189fdc8','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','1bc2a68f42b0f93e90f2c6dc258d31378235d117bb1708f8537da0fb66d3b8a2','2026-05-12T05:32:02.719Z','2026-04-28T05:32:02.719Z') ON CONFLICT (token) DO NOTHING;
INSERT INTO sessions (id,user_id,token,expires_at,created_at) VALUES ('8a510fd4-b579-485d-b644-7c0a385b5880','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','d689608a8e2b143c1b3b3cb2f116f2b9db1dd5c6c9922cbe53650b33c892247b','2026-05-12T13:39:55.975Z','2026-04-28T13:39:55.974Z') ON CONFLICT (token) DO NOTHING;
INSERT INTO sessions (id,user_id,token,expires_at,created_at) VALUES ('bfc1bf16-4337-4a21-9782-a6ba61ad6f0d','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','caff6afe15ae38a289bae285ba775b74b7fc139a70c863c99dde92c31776cb9f','2026-05-12T14:13:35.488Z','2026-04-28T14:13:35.488Z') ON CONFLICT (token) DO NOTHING;
INSERT INTO sessions (id,user_id,token,expires_at,created_at) VALUES ('b0e84764-5fda-4781-b386-da2b52338d5a','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','f41e8ea3d4574b04dbd24e041c3494a42e361596bdecce2cc0bb6d7253c1185e','2026-05-12T14:20:26.011Z','2026-04-28T14:20:26.011Z') ON CONFLICT (token) DO NOTHING;
INSERT INTO sessions (id,user_id,token,expires_at,created_at) VALUES ('04f498b6-3b72-4329-a129-1f3ccd8dca6e','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','b3241ff240e133e1820c9f1930d6e2ee41e4ec7c8aaad4e80539018127f7dd6f','2026-05-12T14:26:32.754Z','2026-04-28T14:26:32.754Z') ON CONFLICT (token) DO NOTHING;
-- SERIES
INSERT INTO series (id,title,slug,description,type,parent_id,theme_class,number_format,created_at,updated_at) VALUES ('s_cs','CS Journey','cs-journey','Long-form notes on coursework, engineering experiments, and architecture decisions.','track',NULL,'bg-primary/5',NULL,'2026-03-08T12:00:00.000Z','2026-03-08T12:00:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO series (id,title,slug,description,type,parent_id,theme_class,number_format,created_at,updated_at) VALUES ('s_msc','KCL MSc','kcl-msc','Course logs, implementation notes, and project retrospectives.','degree','s_cs','bg-primary/10',NULL,'2026-03-08T12:05:00.000Z','2026-03-08T12:05:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO series (id,title,slug,description,type,parent_id,theme_class,number_format,created_at,updated_at) VALUES ('s_ase','Advanced Software Engineering','advanced-software-engineering','Architecture, quality, and scaling workflows.','course','s_msc','bg-primary/15',NULL,'2026-03-08T12:10:00.000Z','2026-03-08T12:10:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO series (id,title,slug,description,type,parent_id,theme_class,number_format,created_at,updated_at) VALUES ('s_systems','Systems Notes','systems-notes','Databases, low-level tooling, and performance logs.','course','s_msc','bg-secondary/10',NULL,'2026-03-08T12:15:00.000Z','2026-03-08T12:15:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO series (id,title,slug,description,type,parent_id,theme_class,number_format,created_at,updated_at) VALUES ('s_portfolio','Portfolio Projects','portfolio-projects','Deep-dives into the projects in my portfolio — architecture, build logs, and lessons learned.','projects',NULL,NULL,'Project {n}','2026-04-28T07:18:03Z','2026-04-28T14:14:06.529Z') ON CONFLICT (id) DO NOTHING;
-- POSTS
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_features_demo','features-demo','Blog Platform — Features Demo','A walkthrough of everything this blog system supports, written as a real article.','# Blog Platform — Features Demo

This article is a live demonstration of the blog platform''s capabilities.

---

## Markdown

Posts are written in standard Markdown. Headings, **bold**, *italic*, `inline code`, blockquotes, and fenced code blocks all render as expected.

```typescript
const greet = (name: string): string => `Hello, ${name}!`
console.log(greet("World")) // → Hello, World!
```

---

## Inline Snippets

A snippet tag renders as a live iframe constrained to the prose column. The iframe auto-sizes to its content height.

{{snippet:color-palette-demo}}

---

## Theme-Aware Snippets

Snippets that use `var(--sn-*)` adapt to the site theme automatically. Every snippet receives a `data-theme` attribute and a live `postMessage` when the theme is toggled. **Toggle the theme button in the nav and watch the card below update without reloading.**

{{snippet:theme-aware-demo}}

---

## User Context in Snippets

Every snippet also receives the current viewer''s identity as `window.__sn_user`. If you are logged in it contains `{ id, username, role }`; if not, it is `null`. The value is set before the snippet''s own JS runs, and any subsequent login or logout on the same page fires an `sn:userchange` DOM event so snippets can react live.

Log in or register using the comment section at the bottom of this article, then scroll back up and watch the card below update.

{{snippet:user-greeting}}

This is useful for personalised demos, gated content previews, role-based UI examples, or any interactive snippet that needs to know who it is talking to.

---

## Multi-Tab Snippets

Group related demos into tabs. Each tab is a fully isolated iframe.

{{snippet:sort-visualizer|theme-aware-demo|user-greeting}}

Tabs are always hidden for single-snippet embeds. Use the `notabs` flag to suppress the tab bar explicitly:

{{snippet:sort-visualizer notabs}}

---

## Full-Bleed Snippets

Add `wide` to let a snippet span the full viewport width, breaking out of the prose column.

{{snippet:sort-visualizer wide}}

---

## Multi-Tab + Full-Bleed

{{snippet:sort-visualizer|theme-aware-demo|user-greeting wide}}

---

## Series & Theming

Every post belongs to a series. Series nest arbitrarily, each carrying a `themeClass` applied to its page header. The tree supports expand/collapse and ascending/descending sort.

---

## Post Voting & Threaded Comments

Authenticated readers can upvote posts and leave threaded comments. Votes are de-duplicated per user. Scroll down to try it — logging in here will update the User Context snippet above in real time.

---

## Admin Workflow

There is no visible admin link on the public site. The entry path is a configurable environment variable and can also be triggered via a keyboard shortcut. The dashboard has full CRUD for posts, series, and snippets.',NULL,'published','u_author','2026-04-24T10:00:00.000Z','2026-04-27T22:52:06.335Z','2026-04-24T10:00:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_loopbridge','loopbridge-build-log','LoopBridge Build Log','Coming soon...','# Coming Soon

This post is coming soon.','s_portfolio','published','u_author','2026-03-10T08:30:00.000Z','2026-04-10T08:30:00.000Z','2026-04-10T08:30:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_anagrams_arch','anagrams-architecture-notes','Anagrams Architecture Notes','Coming soon...','# Coming Soon

This post is coming soon.','s_portfolio','published','u_author','2026-03-12T08:30:00.000Z','2026-04-11T08:30:00.000Z','2026-04-11T08:30:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_39920eac','c-database-from-scratch','Building a SQL Database Engine in C','A walkthrough of building a lightweight SQLite-style database from scratch in C, covering page management, B-tree storage, and a command-line REPL.','# Building a SQL Database Engine in C

This project is a lightweight SQLite-style database engine written from scratch in C.

## Motivation

I wanted to deeply understand how databases actually work under the hood — not just how to use them, but how they persist data, manage memory, and parse commands.

## Architecture

The engine is built around three core components:

**1. The REPL**  
A read-eval-print loop that accepts SQL-like commands and routes them to the appropriate handler.

**2. The Pager**  
Manages reading and writing fixed-size pages (4KB) to disk. Pages are cached in memory using a simple LRU strategy.

**3. B-Tree Storage**  
Data rows are stored in a B-tree structure for O(log n) lookups. The implementation supports leaf and internal nodes with proper splitting.

## Key Lessons

- Memory layout matters enormously in C. Careful struct packing saved ~30% storage per row.
- Persistence is harder than it looks — write ordering and fsync are critical for durability.
- The gap between "works" and "correct" is wide when managing raw disk I/O.

## Current State

The engine supports basic `INSERT` and `SELECT` with single-table persistence. Work is ongoing to add `UPDATE`, `DELETE`, and multi-table joins.

> Source: [GitHub](https://github.com/NeroSiegfried/C-Database)
','s_portfolio','published','admin','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_8ea61a59','easychess-dsl','EasyChess: A Domain-Specific Language for Chess Notation','Building a chess DSML with syntax highlighting, validation, and code generation using Java, Xtext, and Xtend.','# EasyChess: A Domain-Specific Language for Chess Notation

EasyChess is a domain-specific modeling language (DSML) for chess notation, built with Xtext and Xtend inside the Eclipse IDE ecosystem.

## What is a DSML?

A domain-specific modeling language lets domain experts express ideas in their own vocabulary rather than a general-purpose programming language. For chess, that means writing game notation in a form that can be validated, highlighted, and transformed automatically.

## The Language

EasyChess allows you to write annotated chess games like:

```
game KasparovVsDeepBlue1997 {
  white: "Kasparov"
  black: "Deep Blue"
  
  1. e4 e5
  2. Nf3 Nc6
  3. Bb5 a6
}
```

The toolchain validates move legality, highlights syntax, and can generate PGN output.

## Technical Stack

- **Xtext** for grammar definition and parser generation
- **Xtend** for code generation (PGN export)
- **JUnit** for grammar validation tests
- **Eclipse IDE** as the host platform

## Lessons Learned

Xtext''s grammar DSL is powerful but has a steep learning curve. The most interesting challenge was implementing move validation — chess rules are deceptively complex once you account for en passant, castling rights, and check detection.

> Source: [GitHub](https://github.com/NeroSiegfried/EasyChess-DSL)
','s_portfolio','published','admin','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_d98d5c75','fitness-tracker-ai','AI-Powered Fitness Tracker','A fitness app that suggests personalised workouts and meals using AI APIs, with progression tracking and history.','# AI-Powered Fitness Tracker

A React-based fitness application that uses OpenAI''s API to generate personalised workout and meal suggestions for beginners.

## Features

- **AI workout generator** — tells you exactly what to do based on your fitness level, available equipment, and goals
- **Meal suggestions** — generates meal plans that align with your calorie and macro targets
- **Progression tracking** — logs your workout history and visualises progress over time
- **Adaptive difficulty** — suggestions get harder as you improve

## Tech Stack

- **React** for the UI
- **Node.js + Express** for the backend API proxy
- **OpenAI API** for workout/meal generation
- **LocalStorage** for persistent history (no auth required)

## Architecture Note

All AI calls go through a Node.js proxy to protect the API key. The frontend never touches the raw OpenAI endpoint.

## What I Learned

Prompt engineering is a real skill. The difference between a generic "suggest a workout" prompt and a structured prompt with user context, equipment constraints, and output format specifications is dramatic. Getting consistent, parseable JSON back from the model required significant iteration.

> Source: [GitHub](https://github.com/NeroSiegfried/fitness-tracker)
','s_portfolio','published','admin','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_5048a0cd','anagrams-legacy','Anagrams Game (Original Browser Version)','The original browser-based single-player Anagrams clone — where this whole project started.','# Anagrams Game (Original Browser Version)

Before the multiplayer React version, there was this: a clean single-player Anagrams clone built entirely in vanilla JavaScript, HTML, and CSS.

## Background

I wanted to recreate the Game Pigeon Anagrams game from my phone — the kind you play with friends over iMessage. The goal was to ship something playable quickly while focusing on clean UX.

## How It Works

You''re given a set of scrambled letters. Type as many words as you can before the timer runs out. Longer words score more points.

Key mechanics:
- Letter pool resets on each use
- Real dictionary validation (no made-up words)
- Score multipliers for longer words
- Smooth animations for accepted/rejected guesses

## What Made It Interesting

Building a dictionary validation system without a backend was the main challenge. I ended up using a pre-compiled word list bundled with the JavaScript, which made the app fully offline-capable.

The UI animation work — making letter tiles feel responsive and satisfying — took longer than the actual game logic.

## Legacy

This project directly led to the full-stack multiplayer version (Anagrams v2) which replaced it. If you want the real experience, see that project.

> Source: [GitHub](https://github.com/NeroSiegfried/anagrams-game)
','s_portfolio','published','admin','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_adf9a7f1','blog-platform-ejs','Full-Stack Blog Platform with EJS and PostgreSQL','A multi-role blog with owner, author, and reader access levels, built with server-side EJS templates and a PostgreSQL backend.','# Full-Stack Blog Platform with EJS and PostgreSQL

A traditional server-rendered blog with multi-role access control — owner, author, and reader — built before I moved to Next.js.

## Stack

- **Node.js + Express** for routing and server logic
- **EJS** for server-side HTML templating
- **PostgreSQL** for persistent storage
- **bcrypt** for password hashing
- **express-session** for session management

## Roles

| Role   | Can do |
|--------|--------|
| Owner  | Manage users, delete any post, full admin |
| Author | Create, edit, and delete their own posts |
| Reader | Browse and read posts |

## Database Schema

Three main tables: `users`, `posts`, and `sessions`. Posts link to users via foreign key. Sessions use a server-side store backed by PostgreSQL.

## What I Learned

Session management is trickier than it looks. Race conditions between session creation and database writes caused intermittent auth bugs early on. Moving to a proper session store fixed this.

EJS is simple and explicit — great for learning, but I quickly hit its limits for interactive UIs. This project was the reason I moved to React + Next.js.

> Source: [GitHub](https://github.com/NeroSiegfried/blog-project)
','s_portfolio','published','admin','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_b20b6c3c','report-generator-ai','Automated Departmental Report Generator','A Flask app that scrapes external data sources and composes structured reports with AI-assisted insight generation.','# Automated Departmental Report Generator

A Python Flask application that automates the tedious process of pulling together departmental reports from multiple data sources.

## Problem

Report compilation was manual: someone would spend hours pulling data from various web dashboards, copy-pasting into a template, then writing a summary. This project cuts that to minutes.

## How It Works

1. **Scraping** — BeautifulSoup spiders pull structured data from internal and external web sources
2. **Assembly** — Collected data is normalised and inserted into a report template
3. **AI insights** — The AI API analyses the data and suggests key takeaways for the reader
4. **Output** — A structured PDF or HTML report is generated and available for download

## Tech Stack

- **Python + Flask** for the web app
- **BeautifulSoup** for scraping
- **Jinja2** for report templating
- **AI API** (GPT family) for insight generation
- **WeasyPrint** for PDF export

## Edge Cases That Bit Me

Web scraping breaks whenever the source site updates its layout. I ended up building a monitoring system that alerts when a scraper returns an unexpected result count, which catches layout changes before they silently corrupt reports.

> Source: [GitHub](https://github.com/NeroSiegfried/report-generator)
','s_portfolio','published','admin','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO posts (id,slug,title,excerpt,content,series_id,status,author_id,created_at,updated_at,published_at) VALUES ('p_f08ae071','model-surveillance-satellite','Model Surveillance Satellite — Team Project','A team-built satellite prototype with networking, live video streaming, and systems-level Python running on Linux.','# Model Surveillance Satellite — Team Project

A physical model satellite prototype built as a team project, featuring live video streaming, remote control over a network, and an onboard Linux system.

## What We Built

A working model satellite the size of a shoebox that:
- Streams live video feed over a local network
- Accepts remote pan/tilt commands
- Runs autonomously if the connection drops (safe mode)
- Logs telemetry (orientation, temperature, uptime) to an onboard file

## My Role

I was responsible for the networking layer and the video streaming pipeline. This involved setting up the FFmpeg stream, handling reconnection logic, and building the ground station interface that displayed the live feed alongside telemetry data.

## Tech Stack

- **Raspberry Pi** running Debian Linux as the satellite''s onboard computer
- **Python** for control software and telemetry collection
- **FFmpeg** for video capture and streaming
- **Bash** for startup scripts and watchdog processes
- **Socket programming** for the command channel

## What Made It Hard

Real-time video over an unreliable Wi-Fi connection is brutal. Latency spikes would cause the FFmpeg pipe to stall, hanging the entire Python process. We ended up using a separate thread for the video stream with a watchdog that restarts FFmpeg if it goes silent for more than 3 seconds.

Physical testing also revealed that our antenna placement caused significant interference. We solved it by shielding the Pi with copper tape and repositioning the antenna to the exterior of the model.
','s_portfolio','published','admin','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
-- SNIPPETS
INSERT INTO snippets (id,slug,title,description,html,css,js,created_at,updated_at) VALUES ('snip_sort','sort-visualizer','Bubble Sort Visualizer','Simple sorting animation snippet for interactive posts.','<div id="bars" style="display:flex;gap:6px;align-items:flex-end;height:180px;padding:12px;"></div><button id="run" style="margin:12px;padding:8px 12px;border-radius:8px;border:1px solid #ddd;">Run</button>','body{margin:0;font-family:Inter,system-ui;background:#0b1020;color:#e8ecff}#bars div{width:18px;background:linear-gradient(180deg,#4f8cff,#2f70ff);border-radius:6px 6px 0 0;transition:height .2s ease}','const root=document.getElementById(''bars'');const values=[32,110,58,150,94,42,76,128];const draw=()=>{root.innerHTML='''';values.forEach(v=>{const b=document.createElement(''div'');b.style.height=`${v}px`;root.appendChild(b)})};draw();document.getElementById(''run'').onclick=async()=>{for(let i=0;i<values.length;i++){for(let j=0;j<values.length-i-1;j++){if(values[j]>values[j+1]){[values[j],values[j+1]]=[values[j+1],values[j]];draw();await new Promise(r=>setTimeout(r,90));}}}}','2026-03-10T07:00:00.000Z','2026-03-10T07:00:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO snippets (id,slug,title,description,html,css,js,created_at,updated_at) VALUES ('snip_layout','responsive-layout-lab','Responsive Layout Lab','Live CSS grid/flex sandbox.','<main><h3>Resize to test</h3><section class="cards"><article>A</article><article>B</article><article>C</article><article>D</article></section></main>','body{margin:0;padding:20px;font-family:Inter,system-ui;background:#111;color:#fff}h3{margin:0 0 14px}.cards{display:grid;gap:12px;grid-template-columns:repeat(1,minmax(0,1fr))}article{background:#2f70ff;padding:20px;border-radius:10px}@media(min-width:640px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(min-width:1024px){.cards{grid-template-columns:repeat(4,minmax(0,1fr))}}','console.log(''responsive layout lab loaded'')','2026-03-11T07:00:00.000Z','2026-03-11T07:00:00.000Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO snippets (id,slug,title,description,html,css,js,created_at,updated_at) VALUES ('snip_palette','color-palette-demo','Colour Palette Demo','Light-themed colour swatches — demonstrates snippet style isolation.','<div class="grid"><div class="swatch primary">Primary</div><div class="swatch accent">Accent</div><div class="swatch muted">Muted</div><div class="swatch success">Success</div><div class="swatch warning">Warning</div><div class="swatch danger">Danger</div></div>','body{margin:0;font-family:system-ui,sans-serif;background:#f0f4ff;padding:24px;min-height:100vh;box-sizing:border-box}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.swatch{padding:28px 16px;border-radius:12px;font-size:.82rem;font-weight:700;letter-spacing:.04em;display:flex;align-items:center;justify-content:center}.primary{background:#4f8cff;color:#fff}.accent{background:#ff6b2b;color:#fff}.muted{background:#94a3b8;color:#1e293b}.success{background:#22c55e;color:#fff}.warning{background:#f59e0b;color:#1e293b}.danger{background:#ef4444;color:#fff}','','2026-04-24T03:20:38.999Z','2026-04-24T03:20:38.999Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO snippets (id,slug,title,description,html,css,js,created_at,updated_at) VALUES ('snip-theme-aware-demo','theme-aware-demo','Theme-Aware Card','A card component that responds to the site theme in real time using --sn-* CSS variables and data-theme.','<div class="card">
  <div class="avatar">⚡</div>
  <h2 class="name">Theme-Aware Card</h2>
  <p class="bio">Toggle the theme button in the nav — this card adapts in real time using CSS variables passed in from the host page. No reload, no flash.</p>
  <div class="tags">
    <span class="tag">--sn-primary</span>
    <span class="tag">--sn-muted</span>
    <span class="tag">data-theme</span>
  </div>
  <button class="cta">Follow</button>
</div>','body {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px;
  font-family: system-ui, sans-serif;
}
.card {
  background: var(--sn-muted);
  border: 1px solid var(--sn-border);
  border-radius: 16px;
  padding: 32px 24px;
  max-width: 340px;
  width: 100%;
  text-align: center;
}
.avatar {
  font-size: 2.5rem;
  margin-bottom: 12px;
}
.name {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 700;
}
.bio {
  margin: 0 0 16px;
  font-size: 0.85rem;
  color: var(--sn-muted-fg);
  line-height: 1.5;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 20px;
}
.tag {
  background: var(--sn-bg);
  border: 1px solid var(--sn-border);
  border-radius: 99px;
  font-size: 0.72rem;
  padding: 3px 10px;
  font-family: monospace;
}
.cta {
  background: var(--sn-primary);
  color: var(--sn-primary-fg);
  border: none;
  border-radius: var(--sn-radius);
  padding: 10px 28px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.cta:hover { opacity: 0.85; }','','2026-04-27T21:51:28.920Z','2026-04-27T21:51:28.920Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO snippets (id,slug,title,description,html,css,js,created_at,updated_at) VALUES ('snip-user-greeting','user-greeting','User Greeting','Reads window.__sn_user to greet the current visitor by name, or shows a guest message if not logged in.','<div class="card">
  <div class="avatar" id="avatar">?</div>
  <p class="greeting" id="greeting">Loading…</p>
  <p class="sub" id="sub"></p>
</div>','body{display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;font-family:system-ui,sans-serif;}
.card{text-align:center;padding:32px 24px;border-radius:16px;background:var(--sn-muted);border:1px solid var(--sn-border);max-width:300px;width:100%;}
.avatar{font-size:3rem;margin-bottom:12px;}
.greeting{margin:0 0 6px;font-size:1.15rem;font-weight:700;}
.sub{margin:0;font-size:0.82rem;color:var(--sn-muted-fg);}','function render(){
  var u=window.__sn_user;
  if(u&&u.username){
    document.getElementById(''avatar'').textContent=''👋'';
    document.getElementById(''greeting'').textContent=''Hello, ''+u.username+''!'';
    document.getElementById(''sub'').textContent=''Role: ''+u.role+'' · You are signed in.'';
  } else {
    document.getElementById(''avatar'').textContent=''👤'';
    document.getElementById(''greeting'').textContent=''Hello, Guest!'';
    document.getElementById(''sub'').textContent=''Log in or register to get a personalised greeting.'';
  }
}
render();
// Re-render if user changes without page reload
document.addEventListener(''sn:userchange'', render);','2026-04-27T22:52:06.335Z','2026-04-27T22:52:06.335Z') ON CONFLICT (id) DO NOTHING;
-- COMMENTS
INSERT INTO comments (id,post_id,user_id,parent_id,content,hidden,created_at,updated_at,edited_at) VALUES ('c1','p_anagrams_arch','u_reader_1',NULL,'Looking forward to this one.',false,'2026-04-11T12:00:00.000Z','2026-04-11T12:00:00.000Z',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO comments (id,post_id,user_id,parent_id,content,hidden,created_at,updated_at,edited_at) VALUES ('c2','p_features_demo','u_reader_2',NULL,'The snippet embed is a really clean touch.',false,'2026-04-24T11:00:00.000Z','2026-04-28T14:29:56.669Z',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO comments (id,post_id,user_id,parent_id,content,hidden,created_at,updated_at,edited_at) VALUES ('740d180f-7983-4770-842f-75f1bd9610c8','p_features_demo','e840a905-46a8-443e-8942-a0035f826b64',NULL,'Testing comment',false,'2026-04-28T02:50:52.109Z','2026-04-28T14:29:58.126Z',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO comments (id,post_id,user_id,parent_id,content,hidden,created_at,updated_at,edited_at) VALUES ('b236935c-8d74-4c3a-a7fb-1abd98201287','p_features_demo','e840a905-46a8-443e-8942-a0035f826b64','c2','Testing replies',false,'2026-04-28T03:02:10.829Z','2026-04-28T14:30:11.126Z',NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO comments (id,post_id,user_id,parent_id,content,hidden,created_at,updated_at,edited_at) VALUES ('37758b02-e154-44b4-b92d-78d612e141a2','p_features_demo','e840a905-46a8-443e-8942-a0035f826b64','b236935c-8d74-4c3a-a7fb-1abd98201287','Testing edits

Edit: This rocks?',false,'2026-04-28T03:29:16.348Z','2026-04-28T14:30:19.025Z','2026-04-28T03:29:32.326Z') ON CONFLICT (id) DO NOTHING;
INSERT INTO comments (id,post_id,user_id,parent_id,content,hidden,created_at,updated_at,edited_at) VALUES ('675cf8f1-de31-4ac1-925d-955883091cdc','p_features_demo','fa1e0324-4d75-476c-92f1-7f1acbfd61fa',NULL,'testing admin comments',false,'2026-04-28T05:51:39.417Z','2026-04-28T05:51:39.417Z',NULL) ON CONFLICT (id) DO NOTHING;
-- COMMENT VOTES
INSERT INTO comment_votes (id,comment_id,user_id,value,created_at) VALUES ('cv1','c2','u_reader_1',1,NOW()) ON CONFLICT (comment_id,user_id) DO NOTHING;
INSERT INTO comment_votes (id,comment_id,user_id,value,created_at) VALUES ('af796204-b035-4710-b6fe-211f74d816c3','740d180f-7983-4770-842f-75f1bd9610c8','e840a905-46a8-443e-8942-a0035f826b64',1,NOW()) ON CONFLICT (comment_id,user_id) DO NOTHING;
INSERT INTO comment_votes (id,comment_id,user_id,value,created_at) VALUES ('da87916a-ccfb-40a9-b6c7-a2a8f7e4a7bd','37758b02-e154-44b4-b92d-78d612e141a2','e840a905-46a8-443e-8942-a0035f826b64',1,NOW()) ON CONFLICT (comment_id,user_id) DO NOTHING;
INSERT INTO comment_votes (id,comment_id,user_id,value,created_at) VALUES ('d9c8ef4f-e2df-4974-a52a-8921e50961b4','c2','e840a905-46a8-443e-8942-a0035f826b64',1,NOW()) ON CONFLICT (comment_id,user_id) DO NOTHING;
-- POST VOTES
INSERT INTO post_votes (id,post_id,user_id,value,created_at) VALUES ('pv1','p_features_demo','u_reader_1',1,NOW()) ON CONFLICT (post_id,user_id) DO NOTHING;
INSERT INTO post_votes (id,post_id,user_id,value,created_at) VALUES ('pv2','p_features_demo','u_reader_2',1,NOW()) ON CONFLICT (post_id,user_id) DO NOTHING;
INSERT INTO post_votes (id,post_id,user_id,value,created_at) VALUES ('ac957b46-16bc-4bb7-994e-d5cf9d1e70b9','p_features_demo','e840a905-46a8-443e-8942-a0035f826b64',1,NOW()) ON CONFLICT (post_id,user_id) DO NOTHING;