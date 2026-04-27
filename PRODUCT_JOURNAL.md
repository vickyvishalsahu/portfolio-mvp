# Portfolio MVP — Product Journal

> **What this document is:** A living record of what we built, why we changed direction, what worked, and what didn't. Updated at the end of every phase. Written for stakeholders and for our future selves — so neither has to reconstruct history from a git log.
>
> **Who maintains it:** Leila writes and owns this. Mr. Wolf and Kai contribute technical verdicts. Vicky approves before each entry goes in.
>
> **How to read it:** Chronologically for context. Jump to *Decision Log* for a quick reference of pivots. Jump to *Current State* for where we are right now.

---

## The Problem We're Solving

An Indian expat living in Berlin holds investments across multiple countries and brokers — Zerodha in India, Scalable Capital in Europe, crypto on Binance or Coinbase. There is no single place to see all of it together. Instead:

- Open Zerodha. See ₹8L. Convert to EUR in your head.
- Open Scalable. See €12,000.
- Open Binance. See 0.04 BTC. Convert again.
- Add them up somewhere. Maybe a spreadsheet.

This is the status quo for millions of expats. Mental currency math, app-switching, no historical view, no single P&L number.

**What we're building:** A local-first portfolio tracker. Gmail is the data source — broker confirmation emails carry every trade you've ever made. An AI parses them. A local SQLite database stores them. A dashboard surfaces the consolidated picture in EUR.

**Why local-first:** Your net worth data should not live in a cloud you don't control. Everything stays on your machine. No account required. No server with your financial data. This is a deliberate trust decision, not a technical shortcut.

---

## The Team

| Role | Who | Responsibility |
|---|---|---|
| Product | Leila | What to build, in what order, and why. Briefs before code. Reviews after ship. |
| Architecture | Mr. Wolf | How to build it. Reads code before planning. Writes briefs for Kai. |
| Engineering | Kai | Builds with TDD. Tests live next to the file they test. Flags blockers early. |
| Owner | Vicky | Final call on product and architecture decisions. |

---

## Phase 0 — Proof of Concept
*April 2026 · Foundation*

### What we set out to build

A working end-to-end pipeline: fetch broker emails from Gmail, parse them into structured trades using an AI model, store them locally, and display a portfolio dashboard.

### What we built

- **Gmail OAuth** — read-only access. User authorises, a refresh token is stored in `.env.local`. From that point, the app can fetch emails silently.
- **Email parsing** — Claude (Anthropic SDK) reads raw email bodies and extracts: asset type, ticker, name, quantity, price, currency, transaction type (buy/sell/dividend/SIP), date, and broker.
- **SQLite schema** — three tables: `raw_emails`, `transactions`, `price_cache`. Designed to be append-only. No deletes.
- **Holdings computation** — groups all transactions by ticker, walks them chronologically, accumulates cost basis, fetches live price, returns P&L per position.
- **Price sources** — Yahoo Finance for stocks and ETFs, AMFI for Indian mutual funds, CoinGecko for 12 cryptocurrencies.
- **Dashboard** — total value in EUR, total P&L, allocation donut chart, top 5 holdings.
- **Holdings page** — full sortable table of all positions.
- **Sync page** — connect Gmail, fetch emails, parse emails.

### Key decisions made here

**EUR as the single base currency.** All values, everywhere in the app, are EUR. Currency conversion happens at ingestion — not at display time. This keeps the data layer simple and prevents a class of bugs where the same position appears in different currencies depending on how you look at it.

**SQLite over a hosted database.** Local file, no network dependency, no account, no cost. Aligns with the local-first trust story. Works offline. Can be backed up by copying one file.

**Gmail as the data source (not CSV import or broker APIs).** Broker APIs require developer agreements, approval processes, and are different per broker. CSV formats change without notice. Email is universal — every broker sends confirmation emails, and the format is stable enough for AI parsing.

### What worked

The pipeline worked end-to-end on first real data. Claude parsed Scalable Capital and Zerodha emails correctly on the first attempt. The SQLite schema has not needed structural changes since this phase.

### What didn't work

**Setup requires a terminal.** After Gmail OAuth completes, the refresh token needs to be manually copied into `.env.local` and the server restarted. A developer can do this. No one else can. This is the product's single biggest usability gap, and it remained unfixed through multiple phases.

**No trust communication.** The app had no language explaining what it accessed, what it stored, or that data stayed local. For a financial product, silence on data practices reads as suspicious — not neutral.

**No historical view.** The dashboard showed portfolio value *now*. Every time you opened it, it was just now. No trend, no delta, no reason to come back tomorrow.

---

## Phase 1 — Trust Layer
*April 2026 · Batch 1*

### Why this phase

Before building more features, two things had to be fixed: a calculation bug that produced wrong P&L numbers, and a trust gap that left users with no language about what the app was doing with their data.

In financial products, a wrong number destroys trust faster than any missing feature. We prioritised fixes over features.

### What we built

**Sell P&L bug fix.** If a sell transaction arrived before its matching buy — which happens when syncing from a date mid-history — the position quantity went negative, corrupting all subsequent P&L calculations silently. Fixed with a clamp: quantity can never go below zero after a sell. Eight TDD tests now cover this edge case.

**Gmail scope transparency.** Added a callout on the Sync page, shown before the Connect Gmail button, explaining exactly what access is requested and why. *"We request read-only Gmail access to find broker confirmation emails. Only emails from [selected brokers] will be stored locally. No other emails are read, stored, or transmitted."* This was a GDPR-aware decision — European users will ask where their data goes.

**Local-first trust signal.** Added a footer to every page: a persistent, low-profile statement that data stays on the device. This surfaces the product's primary moat — local-first architecture — instead of burying it in a README.

**Price freshness indicator.** The holdings page now shows when prices were last updated (e.g. "Prices: 12 min ago") and flags tickers that failed to fetch in amber. Users should never be looking at stale data without knowing it.

**Secondary currency display.** Indian holdings now show their value in INR below the EUR figure — formatted in the Indian number system (₹7.6L, not ₹760,000). This made Indian positions feel legible rather than abstract.

### Key decisions made here

**Trust before features.** Leila's original brief was explicit: the product's moat is trust, and trust is fragile in financial products. Shipping features on top of a silent data bug and zero trust communication was the wrong order.

### What worked

The local-first footer was zero engineering effort and immediately made the product feel more considered. The secondary currency display was a small change with large emotional impact — Indian holdings suddenly felt real.

### What didn't work

Nothing shipped in this phase failed. But this phase also revealed how much work remained on the onboarding problem — we fixed the trust language but the setup experience (copy-paste token, edit `.env.local`) remained broken.

---

## Phase 2 — Time & Context
*April 2026 · Batch 2–3*

### Why this phase

A portfolio tracker without history is a snapshot tool. Snapshots are mildly interesting. Trends are emotionally compelling. The daily engagement loop — checking your net worth, noticing it moved, understanding why — requires memory. The app had none.

### What we built

**Daily snapshots.** New `snapshots` table with one row per date (enforced at the database level via a unique constraint — no application-side check-then-insert). Every time the portfolio API is called, it records the day's total value. Idempotent by design.

**Net worth delta.** The dashboard now shows: *"↑ €1,200 vs 30d ago"* (or 7d ago if 30 days of history don't exist yet). Computed by comparing today's snapshot to the closest snapshot at or before the target date.

**Net worth line chart.** A Recharts line chart of all snapshots. Renders only when at least 2 data points exist — so new users don't see an empty chart, they see nothing until there's something worth showing.

**Broker allocation toggle.** The allocation donut chart gained a toggle: By Type (stocks, ETFs, mutual funds, crypto) and By Broker (Scalable Capital, Zerodha, Binance). The broker view answers a question expats actually ask: *how much of my portfolio is in India vs Europe?*

**10 new TDD tests** covering snapshot recording, idempotency, and delta calculation across boundary conditions (missing data, older-than-target date lookup).

### Key decisions made here

**INSERT OR IGNORE for idempotency, not application-side checks.** The database enforces one snapshot per date. `recordSnapshot()` just fires an insert and moves on. This is simpler, safer, and can't have race conditions.

**Show the chart only when it has meaning.** Rendering an empty chart for new users communicates "this feature is broken" not "this feature needs time." The conditional render is a UX decision.

### What worked

The 30d delta was the single highest-value addition to the dashboard. It changed the product from a static viewer to something with a pulse.

### What didn't

The broker allocation toggle was right to build. But it surfaced a code smell: the broker allocation computation was in the API route, not in `lib/`. Business logic that belongs in the data layer was leaking into the routing layer. Flagged as a known smell, not yet fixed.

---

## Phase 3 — Completions
*April 2026 · Batch 4*

### Why this phase

Three features from Leila's original backlog had been deferred: a way to understand which positions moved, a way to export your data, and a way to enter transactions that the parser missed. All three close real gaps.

### What we built

**Biggest movers.** Dashboard section showing top 3 gainers and top 3 losers since the last price refresh. Required a schema addition: `prev_price_eur` column on `price_cache` — the previous price is saved before every overwrite. Delta is computed at display time. Section is hidden entirely until previous price data exists.

**CSV export.** Holdings page gains an export button. Generates a CSV of all transactions — ticker, name, type, quantity, price, currency, date, broker. No library — built as a plain string. Delivered as `text/csv` with a filename that includes today's date. This also satisfies GDPR Article 20 (right to data portability) for personal use.

**Manual transaction entry.** Form at `/transactions/new` for adding trades that the email parser missed or couldn't parse. Uses the same `insertTransaction()` function as the automated pipeline — `email_id` is set to `'manual'` to distinguish source. The sync page's parse error list now links directly to this form: *"Add manually →"* This closes the loop Leila flagged in the original brief: parse errors were silently losing real trades.

### Key decisions made here

**Reuse `insertTransaction()` for manual entry.** We didn't add a separate insert path for manual trades. The existing function handles it — the `email_id: 'manual'` marker is enough to distinguish source if we ever need to filter by it.

**No CSV library.** The export is a simple string concatenation. Adding a library for something this straightforward would be over-engineering.

### What worked

The parse error → manual entry link is the best UX decision in this batch. It turns a dead end (parse failed, transaction lost) into a recoverable path.

### What didn't

The biggest movers section only shows when previous price data exists — which means it's invisible on first load or after a fresh install. This is intentional but creates a confusing experience for new users who don't know why the section isn't there.

---

## Phase 4 — Infrastructure Overhaul
*April 2026 · Post-Batch 4*

### Why this phase

Two things were becoming friction: the AI parser was tightly coupled to Claude (Anthropic SDK), and the broker list was hardcoded in the parser. Both limited the product's adaptability.

On the AI side: Claude is a premium model. For a parsing task that runs on dozens of emails at a time, the cost-to-capability ratio was wrong. We needed a lighter, faster model — and a way to swap providers without rewriting the parser.

On the broker side: every new broker required a code change. The sync also fetched all emails matching any broker domain — not just the brokers the user actually held. This was wasteful and leaked scope.

### What we built

**Multi-provider parser architecture.** The parser was split into:
- `lib/parser.ts` — orchestration layer: pre-filter (does this email look like a transaction?) → dispatch to provider
- `lib/parsers/types.ts` — `EmailParser` interface (one method: `parse()`)
- `lib/parsers/groq.ts` — Groq implementation using `llama-3.1-8b-instant`
- `lib/parsers/gemini.ts` — Gemini implementation as a second option
- `lib/parsers/index.ts` — factory: reads `AI_PROVIDER` env var, lazy-loads the right implementation

Adding a new provider now means adding one file and one case in the factory. The orchestration layer doesn't change.

**Pre-filter on sender and subject.** Before spending an API call, the parser checks: does the sender domain match any known broker? Does the subject contain transaction keywords (order, confirmation, bought, sold, SIP, etc.)? If neither matches, the email is skipped without calling the AI. This reduced unnecessary API calls significantly.

**Broker catalog.** `lib/brokers.ts` replaces hardcoded strings with a typed `BROKER_CATALOG` array. Nine brokers defined: Scalable Capital, Zerodha, CAMS, Groww, Coinbase, Binance, Paytm Money, Angel One, Upstox. Each entry defines: sender domains (for the parser pre-filter), Gmail search terms (for the email fetch query), asset types, and region.

**Broker selection.** Users choose which brokers they hold on the Sync page. Selection persists to the `settings` table. Gmail sync only fetches from selected brokers — not the entire catalog. A user with only Scalable Capital and Zerodha doesn't fetch Binance emails.

**Custom sender domains.** Per-broker, users can add sender domains beyond the catalog defaults. Some brokers use non-obvious subdomains for notifications. Custom domains are stored in `settings`, merged at sync time with the catalog defaults. Catalog domains are read-only in the UI; custom ones can be deleted.

**`settings` table.** A generic key-value store (`key TEXT PRIMARY KEY, value TEXT`) for persisting user configuration. Current keys: `selected_brokers` (JSON array), `broker_custom_domains` (JSON object). This pattern can absorb future preferences without schema migrations.

### Key decisions made here

**Switch from Claude to Groq.** The parser task (extract structured JSON from an email body) doesn't require a frontier model. `llama-3.1-8b-instant` via Groq is fast, cheap, and accurate enough for structured extraction with a tight prompt and JSON mode. Claude is a better fit for tasks requiring reasoning, nuance, or long context — none of which this parser needs.

**Keep Claude as an option.** The multi-provider architecture means this is reversible. If parsing quality degrades or a new use case needs it, switching back is a config change.

**Separate `senderDomains` from `gmailSearchTerms`.** These serve different purposes. Sender domains are used for precise matching in the pre-filter (is this email from a known broker?). Gmail search terms are used in the search query — they can be broader because Gmail substring matching works differently. Zerodha is a good example: the parser pre-filter checks exact domains (`zerodha.com`, `kite.zerodha.com`), but the Gmail query uses `zerodha.com` which catches all subdomains via substring match.

### What worked

The pre-filter alone meaningfully reduced AI API calls. Most Gmail inboxes contain far more non-transaction emails than transaction emails — marketing, newsletters, account alerts. Filtering by sender and subject before calling the AI is the right architecture.

The broker catalog is cleaner than hardcoding. It makes the codebase readable to someone unfamiliar with the brokers — each entry is self-documenting.

### What didn't

The `settings` table stores JSON as raw strings. There's no validation at read time beyond a `try/catch`. If the stored JSON is malformed, the app silently falls back to defaults. This is acceptable for personal use but would need hardening before any multi-user scenario.

---

## Current State
*As of April 2026*

### What's working end-to-end

```
Gmail OAuth → Select brokers → Fetch emails → Pre-filter → AI parse → SQLite
→ Holdings computation → Live prices (Yahoo / AMFI / CoinGecko)
→ Dashboard: total EUR value, P&L, 30d delta, allocation chart, top holdings,
  biggest movers, net worth trend chart
→ Holdings page: full table, price freshness, secondary currency, CSV export
→ Sync page: broker selection, custom domains, connect Gmail, fetch, parse
→ Manual entry: form for trades the parser missed
→ Daily snapshots: net worth history for trend chart and deltas
```

### What's not yet built

| Item | Why it matters | Status |
|---|---|---|
| **Mobile responsive layout** | The emotional check-in (2am portfolio look) happens on a phone. The current layout breaks on mobile. | Not started |
| **Guided onboarding** | OAuth callback stores a token that the user still has to manually paste into `.env.local`. Nobody who isn't a developer can set this up. | Not started |

### Known gaps and smells

| Gap | Location | Severity |
|---|---|---|
| Broker allocation computed in API route | `app/api/portfolio/route.ts` | Low — code smell, not a bug |
| `convertToEur` called per-transaction in a loop | `lib/holdings.ts` | Low — in-memory cache saves it, but wrong pattern |
| `settings` JSON values not validated at read | `lib/db.ts` | Low for single user, medium if multi-user |
| Biggest movers invisible on fresh install | `app/page.tsx` | Low — by design, but confusing for new users |
| `TODO.md` is stale | `TODO.md` | Housekeeping — marks Batch 4 items as pending when they've shipped |

---

## Decision Log

A fast reference for why we changed direction. Read top-to-bottom for chronology.

| Decision | What changed | Why |
|---|---|---|
| **Local-first architecture** | No cloud database, no user auth, SQLite on device | Trust is the moat. Financial data should not leave the user's machine. |
| **EUR as base currency** | All values converted to EUR at ingestion | Single source of truth. Prevents currency confusion downstream. |
| **Gmail as data source** | Email over CSV import or broker APIs | Universal across brokers. No API agreements required. AI can parse email bodies. |
| **Trust signals before features** | Batch 1 was fixes and communication, not features | A wrong P&L number or a silent data practice destroys trust in financial products. |
| **INSERT OR IGNORE for idempotency** | Snapshots, raw emails | Let the DB enforce uniqueness. No check-then-insert. Simpler and race-condition-free. |
| **Switch from Claude to Groq** | Parser AI provider | Structured extraction doesn't need a frontier model. llama-3.1-8b-instant is fast, cheap, accurate enough. |
| **Multi-provider parser architecture** | Parser split into interface + implementations | Decouples the parsing task from the provider. Swap or add providers without touching orchestration. |
| **Pre-filter before AI call** | Sender domain + subject keyword check | Most emails are not transactions. Filtering before the API call reduces cost and noise. |
| **Broker catalog** | Replaced hardcoded broker strings | Readable, self-documenting, extensible without code changes to the parser. |
| **User-selected brokers** | Sync fetches only from selected brokers | Reduces scope. A Zerodha-only user shouldn't be fetching Binance email queries. |
| **`settings` KV table** | Persists broker selection and custom domains | Generic enough to absorb future user preferences without schema migrations. |

---

## What This Product Is Not

Worth being explicit, because these are the paths not taken — intentionally.

**Not a robo-advisor.** We show data. We do not recommend actions. The moment we tell a user what to buy or sell, we cross into investment advice territory (MiFID II, BaFin). We stay descriptive.

**Not a tax calculator.** The data to estimate tax exposure exists. We don't surface tax liability numbers. Showing a wrong tax number in a financial product is worse than showing none. If we ever go here, it needs to be clearly labelled as an estimate, not a figure to file.

**Not a multi-user product.** The architecture is explicitly single-user: one SQLite file, one Gmail account, no auth layer. A multi-user version would require a different data model, auth, and compliance posture (GDPR data segregation, etc.).

**Not a replacement for your broker.** We read what's already there. We do not place trades, receive deposits, or custody assets. This matters for regulatory classification — we are a viewer, not a financial service.

---

*Last updated: April 2026 · Next update due: after mobile responsive and guided onboarding ship.*
