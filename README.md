# Portfolio MVP

Personal investment portfolio tracker that automatically parses broker confirmation emails from Gmail, extracts transactions using AI, and displays holdings with real-time pricing in EUR.

## How It Works

1. **Pick your institutions** — Search and select any broker or fund house via the institution picker
2. **Connect Gmail** — OAuth2 flow grants read-only access to your inbox
3. **Sync emails** — Fetches confirmation emails from your selected institutions (runs as a background job)
4. **Parse transactions** — AI extracts structured transaction data; progress tracked in the notification feed
5. **View portfolio** — Dashboard shows allocation, total value, P&L, and top holdings with live prices

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** SQLite (better-sqlite3, WAL mode)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **AI Parsing:** Groq (llama-3.1-8b-instant) — default, configurable via `AI_PROVIDER`. Gemini stub exists but is not yet implemented.
- **Price Data:** Yahoo Finance, AMFI NAV API, CoinGecko
- **Currency:** exchangerate-api.com

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Google Cloud project with Gmail API enabled
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file and fill in your keys
cp .env.local.example .env.local

# Start development server
pnpm dev
```

### Commands

```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm lint       # ESLint
pnpm test       # Run tests (vitest)
pnpm release    # Merge dev → main
```

### Environment Variables

```
GOOGLE_CLIENT_ID          # Gmail OAuth client ID
GOOGLE_CLIENT_SECRET      # Gmail OAuth secret
GOOGLE_REFRESH_TOKEN      # Obtained after first OAuth flow
NEXT_PUBLIC_BASE_URL      # Default: http://localhost:3000

AI_PROVIDER               # AI parser to use: groq | gemini
GROQ_API_KEY              # Groq API key (if AI_PROVIDER=groq)
GEMINI_API_KEY            # Gemini API key (if AI_PROVIDER=gemini)
```

## API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/gmail/auth` | Start Gmail OAuth flow |
| `GET /api/gmail/callback` | OAuth callback handler |
| `POST /api/gmail/disconnect` | Revoke Gmail access |
| `GET /api/gmail/sync` | Sync status |
| `POST /api/gmail/sync` | Fetch new broker emails (background job) |
| `GET /api/emails` | List raw fetched emails |
| `POST /api/parse` | Parse emails into transactions (background job) |
| `GET /api/jobs` | Background job status |
| `GET /api/portfolio` | Portfolio summary + holdings |
| `GET /api/prices` | Refresh live prices |
| `GET /api/export` | Export transactions as CSV |
| `GET /api/institutions` | Get selected institutions |
| `PUT /api/institutions` | Update selected institutions |
| `GET /api/institutions/suggest` | Institution search (Clearbit) |
| `GET /api/rates` | Currency exchange rates |
| `GET /api/transactions` | List transactions |
| `POST /api/transactions` | Create manual transaction |
| `POST /api/snapshots` | Record daily portfolio snapshot |
| `POST /api/dev/reset` | Reset all data (dev only) |

## Project Structure

```
app/
  page.tsx                      # Dashboard — allocation chart, P&L, movers
  holdings/page.tsx             # Full holdings table with CSV export
  sync/page.tsx                 # Gmail sync UI
  sync/institutions/            # Institution picker
  sync/gmail/                   # Gmail connection flow
  sync/emails/                  # Raw email browser
  sync/broker/                  # Broker sub-pages
  transactions/new/page.tsx     # Manual transaction entry
  api/                          # API routes
  components/                   # Shared UI components (nav, notification bell)
domains/
  shared/                       # SQLite schema, shared types + utils
  email-sync/                   # Gmail OAuth + email fetching, hooks, constants
  portfolio/                    # Holdings aggregation + P&L, daily snapshots
  pricing/                      # Yahoo Finance, AMFI, CoinGecko, currency conversion
  transaction-parsing/          # Pre-filter + AI parser orchestration, providers
  notifications/                # Background job store, activity feed hooks
lib/
  format.ts                     # Number + currency formatting helpers
  export.ts                     # CSV export
```

## Data Privacy

Everything runs locally. No cloud database. The SQLite file (`portfolio.db`) stays on your machine and is gitignored. Only three outbound connections are made: Gmail API (to fetch emails), your chosen AI provider (to parse them), and public market data APIs (Yahoo Finance, AMFI, CoinGecko) for prices.
