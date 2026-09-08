# CroudQ

> AI-assisted audience insights for YouTube creators.

CroudQ helps creators understand what their audience is saying. It connects to a YouTube channel, collects recent video and comment data, and turns that feedback into practical insights for future content.

## What Has Been Built

- User registration, login, and protected sessions
- YouTube OAuth channel connection
- YouTube video, metric, and comment synchronization
- Dashboard showing the latest video's views, likes, comments, and analysis status
- AI-generated audience sentiment summaries
- Detection of recurring audience themes
- Identification of important audience concerns
- Recommended next content moves based on comment feedback
- Stored insight artifacts to avoid unnecessary AI regeneration
- Typed frontend and backend communication with tRPC
- PostgreSQL data model managed with Drizzle ORM
- Responsive dashboard interface built with Next.js and Tailwind CSS

## How It Works

1. A creator creates an account and connects YouTube.
2. CroudQ syncs recent videos and comments.
3. The latest video's comments are sent to the insight engine.
4. The insight engine returns a concise audience summary and content recommendation.
5. The result is stored and displayed in the creator dashboard.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Fastify
- tRPC
- Bun
- PostgreSQL
- Drizzle ORM
- YouTube Data API and OAuth
- OpenAI
- Turborepo

## Project Structure

```text
.
├── apps/
│   ├── backend/       # Fastify API, tRPC routers, database and integrations
│   └── web/           # Next.js frontend and creator dashboard
├── package.json       # Workspace scripts
├── turbo.json         # Monorepo task configuration
└── bun.lock           # Dependency lockfile
```

## Run Locally

Install dependencies and start the applications from the repository root:

```bash
bun install
bun run dev
```

## Main Scripts

```bash
bun run dev         # Start the frontend and backend
bun run build       # Build all applications
bun run typecheck   # Type-check all applications
bun run lint        # Lint all applications
```

## Project Goal

CroudQ reduces the effort required to interpret audience feedback. Instead of reading comments one by one, creators get a focused summary of audience sentiment, recurring patterns, friction points, and a clear next content direction.
