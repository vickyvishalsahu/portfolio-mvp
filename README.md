# Portfolio MVP

Personal investment portfolio tracker that automatically parses broker confirmation emails from Gmail, extracts transactions using AI, and displays holdings with real-time pricing — all converted to EUR.

## How It Works

1. **Connect Gmail** — OAuth2 flow grants access to your inbox
2. **Sync emails** — Fetches confirmation emails from supported brokers
3. **Parse transactions** — Claude extracts structured transaction data (ticker, quantity, price, type)
4. **View portfolio** — Dashboard shows allocation, total value, P&L, and top holdings with live prices

## Supported Brokers & Assets

| Broker | Asset Types |
|--------|-------------|
| Scalable Capital | Stocks, ETFs |
| Zerodha | Stocks, ETFs |
| CAMS | Mutual Funds (India) |
| Coinbase | Crypto |
| Binance | Crypto |

All values are converted to EUR using live exchange rates.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** SQLite (better-sqlite3, WAL mode)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **AI Parsing:** Claude API (Sonnet 4)
- **Price Data:** Yahoo Finance, AMFI API, CoinGecko
- **Currency:** exchangerate-api.com

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Google Cloud project with Gmail API enabled
- Anthropic API key

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file and fill in your keys
cp .env.local.example .env.local

# Start development server
pnpm dev
```

### Environment Variables

```
GOOGLE_CLIENT_ID          # Gmail OAuth client ID
GOOGLE_CLIENT_SECRET      # Gmail OAuth secret
GOOGLE_REFRESH_TOKEN      # Obtained after first OAuth flow
ANTHROPIC_API_KEY         # Claude API key
NEXT_PUBLIC_BASE_URL      # Default: http://localhost:3000
```

## API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/gmail/auth` | Start Gmail OAuth flow |
| `GET /api/gmail/callback` | OAuth callback handler |
| `POST /api/gmail/sync` | Fetch new broker emails |
| `POST /api/parse` | Parse emails into transactions |
| `GET /api/portfolio` | Portfolio summary + holdings |
| `GET /api/prices` | Refresh live prices |

## Project Structure

```
app/
  page.tsx              # Dashboard with allocation chart + summary
  holdings/page.tsx     # Full holdings table
  sync/page.tsx         # Gmail sync UI
  api/                  # API routes
lib/
  db.ts                 # SQLite schema and queries
  gmail.ts              # Gmail OAuth + email fetching
  parser.ts             # Claude-powered email parser
  holdings.ts           # Holdings aggregation + P&L
  prices.ts             # Multi-source price fetching
  currency.ts           # EUR conversion
types/
  index.ts              # Shared TypeScript types
```
