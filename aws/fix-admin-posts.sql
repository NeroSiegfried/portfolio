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
','s_portfolio','published','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
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
','s_portfolio','published','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
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
','s_portfolio','published','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
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
','s_portfolio','published','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
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
','s_portfolio','published','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
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
','s_portfolio','published','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;
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
','s_portfolio','published','fa1e0324-4d75-476c-92f1-7f1acbfd61fa','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z','2026-04-28T07:18:03Z') ON CONFLICT (id) DO NOTHING;