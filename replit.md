# URL Downloader

## Overview

A full-stack web app called "URL Downloader" that allows users to download HD videos from TikTok, Instagram, Facebook, YouTube, and X (Twitter) without watermarks.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/url-downloader)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Video Downloading**: yt-dlp (system package)

## Features

- Platform icon row for TikTok, Instagram, Facebook, YouTube, X (Twitter) — clickable
- HD video download without watermarks via yt-dlp
- Download stats (total downloads, total users by platform)
- WhatsApp contact button → https://wa.me/message/TGJQ4ZZVZ3ZWO1 with auto-caption "I need your support HIS EXCELLENCY"
- Owner Panel (PIN: 207617) showing usage stats, daily chart, recent downloads
- "Made by His Excellency" footer
- PostgreSQL database tracking downloads and users

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Owner Panel

- PIN: `207617`
- Shows: total downloads, total users, today's downloads, breakdown by platform, daily chart, recent downloads list

## Database Tables

- `downloads` — tracks every download attempt (url, platform, user IP, success status)
- `users` — tracks unique users by IP with download count

## Deployment (Railway)

This app uses:
- Frontend: React + Vite (builds to static files)
- Backend: Node.js Express server
- Database: PostgreSQL
- yt-dlp: must be installed as system dependency

For Railway deployment, set `DATABASE_URL` env var and ensure yt-dlp is available.
