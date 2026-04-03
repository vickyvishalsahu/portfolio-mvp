# Portfolio MVP

Personal portfolio tracker: Gmail → Claude parsing → SQLite → Next.js dashboard.

## Tech Stack
- **Framework**: Next.js 14 (App Router, Pages dir not used)
- **Language**: TypeScript (strict mode)
- **Database**: SQLite via better-sqlite3
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **AI**: Anthropic SDK (Claude) for parsing broker emails
- **Data**: Gmail API, Yahoo Finance, currency conversion
- **Package manager**: pnpm

## Project Structure
```
app/           → Next.js App Router (pages + API routes)
lib/           → Core logic (db, gmail, parser, prices, currency, holdings)
types/         → Shared TypeScript types
release        → Release script (dev → main)
```

## Commands
```
pnpm dev       → Start dev server
pnpm build     → Production build
pnpm lint      → ESLint
pnpm release   → Merge dev → main
```

## Conventions
- Path alias: `@/*` maps to project root
- All values displayed in EUR (base currency)
- Database file: `portfolio.db` (gitignored)
- Environment variables in `.env.local` (see `.env.example`)
- Git: `dev` (working branch) + `main` (release only)
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- Never commit to `main` directly — use the release script
