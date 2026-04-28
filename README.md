# Portfolio MVP

Personal investment portfolio tracker that automatically parses broker confirmation emails from Gmail, extracts transactions using AI, and displays holdings with real-time pricing in their source currency.

## How It Works

1. **Select your brokers** — Choose which brokers you use; only their emails are fetched
2. **Connect Gmail** — OAuth2 flow grants read-only access to your inbox
3. **Sync emails** — Fetches confirmation emails from your selected brokers
4. **Parse transactions** — AI extracts structured transaction data (ticker, quantity, price, type)
5. **View portfolio** — Dashboard shows allocation, total value, P&L, and top holdings with live prices

## Supported Brokers

| Broker | Asset Types | Region |
|--------|-------------|--------|
| Scalable Capital | Stocks, ETFs, Crypto | Europe |
| Zerodha | Stocks, ETFs, Mutual Funds | India |
| CAMS | Mutual Funds | India |
| Groww | Stocks, ETFs, Mutual Funds | India |
| Angel One | Stocks, ETFs | India |
| Upstox | Stocks, ETFs, Mutual Funds | India |
| Paytm Money | Stocks, ETFs, Mutual Funds | India |
| Coinbase | Crypto | Global |
| Binance | Crypto | Global |
| KFintech | Mutual Funds | India |
| 21Bitcoin | Crypto | Global |

Custom sender domains can be added per broker in the sync UI — useful when a broker rebrands or uses multiple email domains.

All values are converted to EUR using live exchange rates.

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
| `GET /api/gmail/sync` | Sync status |
| `POST /api/gmail/sync` | Fetch new broker emails |
| `POST /api/parse` | Parse emails into transactions |
| `GET /api/portfolio` | Portfolio summary + holdings |
| `GET /api/prices` | Refresh live prices |
| `GET /api/export` | Export transactions as CSV |
| `GET /api/settings/brokers` | Get broker selection + custom domains |
| `PUT /api/settings/brokers` | Update broker selection + custom domains |
| `GET /api/rates` | Currency exchange rates |
| `GET /api/transactions` | List transactions |
| `POST /api/transactions` | Create manual transaction |
| `POST /api/snapshots` | Record daily portfolio snapshot |

## Project Structure

```
app/
  page.tsx                    # Dashboard — allocation chart, P&L, movers
  holdings/page.tsx           # Full holdings table with CSV export
  sync/page.tsx               # Broker selection + Gmail sync UI
  transactions/new/page.tsx   # Manual transaction entry
  api/                        # API routes
domains/
  shared/                     # Broker catalog, SQLite schema, shared types + utils
  email-sync/                 # Gmail OAuth + email fetching, hooks, constants
    hooks/                    # useGmailSync, useBrokerSettings
lib/
  parser.ts                   # Pre-filter + AI parser orchestration
  parsers/
    groq.ts                   # Groq parser (llama-3.1-8b-instant)
    gemini.ts                 # Gemini parser (stub — not yet implemented)
    index.ts                  # Parser factory — reads AI_PROVIDER
    types.ts                  # EmailParser interface
  holdings.ts                 # Holdings aggregation + P&L
  prices.ts                   # Yahoo Finance, AMFI, CoinGecko
  currency.ts                 # EUR conversion
  export.ts                   # CSV export
  format.ts                   # Number + currency formatting helpers
  snapshots.ts                # Daily portfolio value history
```

## Data Privacy

Everything runs locally. No cloud database. The SQLite file (`portfolio.db`) stays on your machine and is gitignored. Only three outbound connections are made: Gmail API (to fetch emails), your chosen AI provider (to parse them), and public market data APIs (Yahoo Finance, AMFI, CoinGecko) for prices.
