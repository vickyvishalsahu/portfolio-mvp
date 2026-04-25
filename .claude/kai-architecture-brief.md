# Architecture Brief for Kai
*Written by Mr. Wolf · April 2026*
*Read this before touching any task. It tells you the file, the pattern, and the gotcha.*

---

## How the codebase is wired

```
app/page.tsx            → dashboard (client component, fetches /api/portfolio)
app/holdings/page.tsx   → holdings table (client component, fetches /api/portfolio)
app/sync/page.tsx       → sync pipeline UI (client component)
app/layout.tsx          → nav + root wrapper

app/api/portfolio/      → GET: runs computeHoldings(), returns summary + holdings
app/api/prices/         → POST: refreshes all price_cache entries
app/api/gmail/sync/     → GET: status check / POST: fetch emails from Gmail
app/api/parse/          → POST: send unparsed emails through Claude

lib/db.ts               → SQLite singleton, schema, all DB functions
lib/holdings.ts         → computeHoldings() — the core aggregation logic
lib/prices.ts           → getPrice(), refreshPrices(), price_cache read/write
lib/currency.ts         → convertToEur(), getExchangeRates()
lib/gmail.ts            → OAuth + fetchBrokerEmails()
lib/parser.ts           → Claude email parsing

types/index.ts          → all shared types
```

**Rules before you write a line:**
- All DB access goes through `lib/db.ts`. No raw SQL in API routes or pages.
- All types go in `types/index.ts`.
- Client components fetch from API routes — they never import from `lib/` directly.
- Follow the existing code style exactly. No new abstractions unless the task requires it.
- Tests first. Write what the function/component should do, watch it fail, then implement.

---

## Batch 1 — No new infrastructure
*Do these first. Fast, isolated, builds trust in the codebase.*

---

### Task #1 — Fix sell P&L bug
**File:** `lib/holdings.ts` · Lines 44–51

**The bug:**
```ts
} else if (tx.transaction_type === 'sell') {
  if (totalQty > 0) {          // only reduces if qty is positive
    const avgCost = totalCostEur / totalQty;
    totalQty -= tx.quantity;
    totalCostEur = totalQty * avgCost;  // can go negative if sell > held qty
  }
  // if totalQty === 0, cost silently stays, qty goes negative → wrong P&L
}
```

**Fix:**
- Clamp `totalQty` to `0` after a sell — never go negative
- If `totalQty <= 0` after the sell, also zero out `totalCostEur`
- No new files. No API changes. Pure logic fix.

```ts
} else if (tx.transaction_type === 'sell') {
  if (totalQty > 0) {
    const avgCost = totalCostEur / totalQty;
    totalQty = Math.max(0, totalQty - tx.quantity);
    totalCostEur = totalQty * avgCost;
  }
}
```

**Test:** Create a transaction group with a sell that exceeds buys — assert `pnl_pct` is 0, not Infinity or negative.

---

### Task #2 — Local-first trust signal
**File:** `app/layout.tsx`

Add a footer below the `<main>` block. One line, muted text:

> *"All data is stored locally on your device. Nothing is uploaded except during Gmail sync and live price lookups."*

Tailwind: `text-xs text-gray-600 text-center py-4 border-t border-gray-800`

No state. No API. No props. Just markup.

---

### Task #13 — Gmail scope transparency
**File:** `app/sync/page.tsx`

Before the "Connect Gmail" button, add an info callout — only visible when `!status?.gmail_connected`. Explain in plain language what `gmail.readonly` means for this app:

> *"We request read-only Gmail access to find broker confirmation emails. We filter by sender — only emails from Scalable Capital, Zerodha, CAMS, Binance, and Coinbase are stored. No other emails are read or saved."*

Style: `bg-gray-800 border border-gray-700 rounded p-4 text-sm text-gray-400` with a small info icon if you want one.

---

### Task #6 — Price freshness timestamp
**File:** `app/holdings/page.tsx` + `app/api/portfolio/route.ts`

**API change:** In `/api/portfolio` GET, add one query to `lib/db.ts`:
```ts
export function getOldestPriceCacheAge(): string | null
// SELECT MIN(updated_at) FROM price_cache
// Returns ISO string or null if cache is empty
```

Add `price_cache_updated_at` to the portfolio API response.

**UI change:** Next to "Refresh Prices" button, show:
- *"Prices updated 3 min ago"* — compute from `Date.now() - new Date(price_cache_updated_at)`
- *"Prices not loaded yet"* — if null

If any tickers failed on last refresh, surface them: *"2 tickers failed to update"* in amber. The `/api/prices` response already returns `failed: string[]` — pass it through state.

---

### Task #7 — Secondary currency display
**File:** `app/holdings/page.tsx`

The `Holding` type already has `currency` and `current_value_eur`. You have everything you need.

In the Value column cell, add a secondary line when `currency !== 'EUR'`:

```tsx
<td className="py-3 text-right">
  <div className="text-white font-medium">{fmt(h.current_value_eur)}</div>
  {h.currency !== 'EUR' && (
    <div className="text-gray-500 text-xs">{fmtLocal(h.current_value_eur * rate, h.currency)}</div>
  )}
</td>
```

**New helper needed:** `fmtLocal(amount, currency)` — uses `Intl.NumberFormat` with the right currency code. For INR use compact notation for large numbers: ₹7.6L not ₹760,000.

**Exchange rate:** Fetch from `/api/portfolio` response or add a `/api/rates` endpoint that returns `{ INR, USD }` from `lib/currency.ts`. Keep it simple — no new state management.

---

## Batch 2 — Snapshot system
*This is the foundation for tasks #3, #4, and #11. Do #3 before touching #4 or #11.*

---

### Task #3 — Daily snapshots + net worth delta

**Step 1: New DB table** — add to `initializeDb()` in `lib/db.ts`:
```sql
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE,           -- YYYY-MM-DD, one row per day
  total_value_eur REAL,
  created_at TEXT
);
```

**Step 2: New file `lib/snapshots.ts`**
```ts
export function recordSnapshot(totalValueEur: number): void
// INSERT OR IGNORE INTO snapshots (date, total_value_eur, created_at)
// VALUES (today, value, now)
// IGNORE = only one snapshot per day

export function getSnapshotDelta(days: 30 | 7): number | null
// SELECT total_value_eur FROM snapshots
// WHERE date <= DATE('now', '-N days')
// ORDER BY date DESC LIMIT 1
// Returns null if no snapshot that old exists yet
```

**Step 3: Call in `/api/portfolio` GET**
After computing `totalValue`, call `recordSnapshot(totalValue)`. Then fetch delta:
```ts
const delta30d = getSnapshotDelta(30);
// Add to summary response: { ..., delta_30d: delta30d ? totalValue - delta30d : null }
```

**Step 4: Dashboard UI** (`app/page.tsx`)
Update the Total Value card to show delta below the main number:
```
€47,234
↑ €1,200 vs 30d ago   ← green if positive, red if negative, gray if null
```

No new page. No new route. One card update.

---

### Task #4 — Portfolio value chart
**Depends on:** Task #3 (snapshots table must exist)

**New API endpoint:** Add `GET /api/snapshots` that returns:
```ts
[{ date: string, total_value_eur: number }]  // all rows, ASC by date
```

Add `getAllSnapshots()` to `lib/snapshots.ts`.

**Dashboard UI** (`app/page.tsx`)
Add a new full-width section below the 2-column row. Recharts `LineChart`:
- X axis: date (format as `MMM 'YY`)
- Y axis: EUR value (use existing `fmt()` for tooltip)
- Single line, no legend needed
- Same dark theme as existing charts — copy tooltip style from the donut chart

Keep it simple: fetch `/api/snapshots` separately in a `useEffect`. Don't jam it into the portfolio fetch.

---

### Task #11 — Biggest movers
**Depends on:** Task #3 (needs yesterday's snapshot for comparison)

**Approach:** Compare each holding's `current_value_eur` against its value 24h ago. The simplest way: add `price_eur_yesterday` to price_cache (store previous price before overwriting on refresh). Alternatively, use snapshots at holding level — but that's more complex. Start simple.

**Simplest viable approach:**
- Add `prev_price_eur REAL` column to `price_cache` table
- On `setCachedPrice()` in `lib/prices.ts`, before updating, read current price and write it to `prev_price_eur`
- In `computeHoldings()`, return `prev_value_eur` alongside `current_value_eur`
- Dashboard: small table — top 3 up, top 3 down by absolute EUR change

Park this until #3 and #6 are done. The pattern will be clearer then.

---

## Batch 3 — Dashboard enhancements

---

### Task #5 — Broker breakdown chart
**File:** `app/api/portfolio/route.ts` + `app/page.tsx`

**API:** In the portfolio route, add `broker_allocation` to the response:
```ts
const brokerAllocation = holdings.reduce<Record<string, number>>((acc, h) => {
  acc[h.broker] = (acc[h.broker] || 0) + h.current_value_eur;
  return acc;
}, {});
```

**UI:** On the allocation card, add a toggle: `[By Type] [By Broker]`. State: `'type' | 'broker'`. Swap the Pie data based on toggle. Same chart, same colours, just different data. No new chart component.

---

## Batch 4 — New flows
*More involved. Do these after Batch 1 and 2 are shipped.*

---

### Task #12 — CSV export
**New file:** `app/api/export/route.ts`

```ts
export async function GET() {
  const transactions = getAllTransactions(); // already exists in lib/db.ts
  const csv = buildCsv(transactions);       // local helper, no library needed
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="portfolio-transactions.csv"'
    }
  });
}
```

CSV columns: `date, broker, ticker, name, asset_type, transaction_type, quantity, price, currency`

No new DB functions. No new lib file. Just the route + a 10-line CSV builder.

**UI:** "Export CSV" button on `/holdings` — an `<a href="/api/export" download>` link styled as a button. No state needed.

---

### Task #10 — Manual transaction entry
**New page:** `app/transactions/new/page.tsx` (client component)
**New route:** `app/api/transactions/route.ts` (POST handler)

**Form fields:** asset_type (select), ticker (text, optional), name (text), quantity (number), price (number), currency (select: EUR/INR/USD), transaction_type (select), transaction_date (date), broker (text)

**POST handler:**
```ts
// Validate all required fields
// Call insertTransaction() — already exists in lib/db.ts
// Return { success: true }
```

**DB:** `insertTransaction()` already exists. Pass `email_id: 'manual'` for manually entered transactions.

**Nav:** Add "Add Transaction" link to the nav in `app/layout.tsx`.

**Validation:** Client-side only. quantity > 0, price > 0, valid date. No Zod, no library — just inline checks before submit.

---

### Task #8 — Guided onboarding
**New page:** `app/setup/page.tsx`
**Modify:** `app/api/gmail/callback/route.ts`

**Approach — store token in a local file, not .env:**
- On callback, write `refresh_token` to `.portfolio-config.json` at `process.cwd()`
- Add `.portfolio-config.json` to `.gitignore`
- In `lib/gmail.ts`, read token from env first, fall back to `.portfolio-config.json`

This removes the terminal dependency. User connects Gmail → token saved automatically → redirect to `/sync`.

**Setup page:** Shows step-by-step status:
1. ✅ App is running
2. ⬜ Connect Gmail → button
3. ⬜ Sync your emails

Redirect to `/sync` when Gmail is connected. Replace the "Connect Gmail" button on `/sync` with a link to `/setup` if not connected.

**Note for Kai:** This is the most architecturally significant task. Don't start it until the quick wins are done and you've got a feel for the codebase. If `.portfolio-config.json` approach feels wrong, discuss with Mr. Wolf first.

---

### Task #9 — Mobile layout
**Files:** `app/page.tsx`, `app/holdings/page.tsx`, `app/layout.tsx`, `app/sync/page.tsx`

**Dashboard:** The 4-card grid is already `grid-cols-1 md:grid-cols-4` — that's fine. The 2-column chart row needs `grid-cols-1 lg:grid-cols-2` — check it's set.

**Holdings table:** On mobile, a full table is unusable. Wrap the table in `overflow-x-auto` as a minimum. Better: below `sm:` breakpoint, switch to a card-per-row layout using `hidden sm:table` on the table and a `sm:hidden` card list.

**Nav:** Check the nav collapses properly on small screens. If not, add a simple hamburger or just stack the links.

Do this last — it's the most tedious and least impactful until the product is otherwise solid.

---

## Summary: execution order

| Batch | Tasks | Complexity |
|-------|-------|------------|
| 1 | #1, #2, #13, #6, #7 | Low — no new infrastructure |
| 2 | #3 → #4 → #11 | Medium — new table, new lib file |
| 3 | #5 | Low — API + UI toggle |
| 4 | #12, #11, #10, #9, #8 | Medium–High — new pages and flows |

Start with Batch 1. Ship it. Then Batch 2. The rest follows.

---

## Batch 4 — Detailed scoping
*Written after Batch 1–3 shipped. Read the Mr. Wolf feedback section too — there are patterns to fix as you go.*

---

### Task #12 — CSV export
**Complexity:** Low. Do this first in Batch 4.

**New file:** `app/api/export/route.ts`

```ts
export async function GET() {
  const transactions = getAllTransactions(); // already in lib/db.ts
  const csv = [
    ['date','broker','ticker','name','asset_type','transaction_type','quantity','price','currency'].join(','),
    ...transactions.map((t: any) =>
      [t.transaction_date, t.broker, t.ticker ?? '', t.name, t.asset_type,
       t.transaction_type, t.quantity, t.price, t.currency].join(',')
    )
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="portfolio-${new Date().toISOString().slice(0,10)}.csv"`,
    }
  });
}
```

**UI:** In `app/holdings/page.tsx` header row, add alongside Refresh Prices:
```tsx
<a href="/api/export" download className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition">
  Export CSV
</a>
```

**Test:** `app/api/export/route.test.ts` — mock `getAllTransactions`, verify CSV headers and first data row format.

---

### Task #11 — Biggest movers
**Complexity:** Medium. Touches schema, prices lib, holdings lib, types, and dashboard UI.

**Step 1: Schema** — Add `prev_price_eur REAL` to `price_cache` in `lib/db.ts`:
```sql
CREATE TABLE IF NOT EXISTS price_cache (
  ticker TEXT PRIMARY KEY,
  price_eur REAL,
  prev_price_eur REAL,   -- ← add this
  price_local REAL,
  currency TEXT,
  updated_at TEXT
);
```

**Step 2: `lib/prices.ts`** — In `setCachedPrice()`, before overwriting, read the current price and preserve it:
```ts
function setCachedPrice(ticker, priceEur, priceLocal, currency) {
  const db = getDb();
  // Preserve the previous price before overwriting
  const existing = db.prepare('SELECT price_eur FROM price_cache WHERE ticker = ?').get(ticker) as any;
  db.prepare(`
    INSERT OR REPLACE INTO price_cache (ticker, price_eur, prev_price_eur, price_local, currency, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ticker, priceEur, existing?.price_eur ?? null, priceLocal, currency, new Date().toISOString());
}
```

**Step 3: `types/index.ts`** — Add `prev_value_eur` to `Holding`:
```ts
prev_value_eur: number | null; // null until first price refresh happens
```

**Step 4: `lib/holdings.ts`** — After fetching current price, also get `prev_price_eur` from the db row:
```ts
const priceRow = db.prepare('SELECT prev_price_eur FROM price_cache WHERE ticker = ?').get(key) as any;
const prevPriceEur = priceRow?.prev_price_eur ?? null;
const prevValueEur = prevPriceEur !== null ? totalQty * prevPriceEur : null;
```
Add `prev_value_eur: prevValueEur` to the holding object.

**Step 5: Dashboard** (`app/page.tsx`) — Add a "Today's Movers" section after the summary cards.
- Compute `change = current_value_eur - prev_value_eur` for holdings where `prev_value_eur !== null`
- Sort descending by change, take top 3 each direction
- Only render section when at least one holding has a `prev_value_eur`
- Show: name, ticker, change in EUR, arrow

**Test:** `lib/prices.test.ts` — mock getDb, verify `setCachedPrice` preserves previous price on second call.

---

### Task #10 — Manual transaction entry
**Complexity:** Medium.

**New files:**
- `app/transactions/new/page.tsx` — client form component
- `app/api/transactions/route.ts` — POST handler

**Form fields** (all required except ticker):
- `asset_type`: select — stock / etf / mf / crypto
- `name`: text
- `ticker`: text (optional)
- `quantity`: number (> 0)
- `price`: number (> 0)
- `currency`: select — EUR / INR / USD
- `transaction_type`: select — buy / sell / dividend / sip
- `transaction_date`: date (not in the future)
- `broker`: text

**API route:**
```ts
export async function POST(req: Request) {
  const body = await req.json();
  // validate required fields
  insertTransaction({ ...body, email_id: 'manual', raw_text: '', confidence: 'high' });
  return NextResponse.json({ success: true });
}
```

**Nav:** Add to `app/layout.tsx`:
```tsx
<a href="/transactions/new" className="text-gray-400 hover:text-white transition">Add Transaction</a>
```

**Sync page bonus:** In the parse errors list (`app/sync/page.tsx`), add a small link after each error:
```tsx
<a href="/transactions/new" className="text-blue-400 hover:underline ml-2">Add manually →</a>
```
This closes the loop Leila flagged — parse failures no longer just dead ends.

**Test:** POST with missing fields returns 400. POST with valid data calls `insertTransaction`. Negative quantity rejected.

---

### Task #9 — Mobile responsive
**Complexity:** Low-medium. CSS sweep, no logic changes.

Go page by page at 375px viewport:

**`app/layout.tsx`** — Nav flex container: add `flex-wrap gap-y-2` so links wrap on small screens.

**`app/holdings/page.tsx`:**
- Table container: ensure `overflow-x-auto` wraps the table
- Header row: `flex-col sm:flex-row items-start sm:items-center gap-3`
- The "Prices: X ago" + button group: stack them

**`app/page.tsx`:**
- Summary cards: already `grid-cols-1 md:grid-cols-4` ✓
- Chart grid: already `grid-cols-1 lg:grid-cols-2` ✓
- Chart heights: reduce to 200px on mobile using Tailwind `h-[200px] md:h-[280px]` on the ResponsiveContainer wrapper div

**`app/sync/page.tsx`:**
- Pipeline button row: add `flex-wrap` so buttons stack on small screens

No JS changes. Pure Tailwind responsive classes.

---

### Task #8 — Guided onboarding
**Complexity:** High. Save for last. Read carefully before starting.

**New file: `lib/config.ts`**
```ts
import path from 'path';
import fs from 'fs';

const CONFIG_PATH = path.join(process.cwd(), '.portfolio-config.json');

export function getStoredToken(): string | null {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw).refresh_token ?? null;
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ refresh_token: token }, null, 2));
}
```

**Update `lib/gmail.ts`** — `getAuthenticatedClient()`: try env first, fall back to file:
```ts
import { getStoredToken } from './config';

export function getAuthenticatedClient() {
  const token = process.env.GOOGLE_REFRESH_TOKEN ?? getStoredToken();
  if (!token) throw new Error('No refresh token found');
  // ... rest unchanged
}
```

**Update `app/api/gmail/callback/route.ts`** — replace the HTML response:
```ts
import { saveToken } from '@/lib/config';

// After getting tokens:
if (!tokens.refresh_token) throw new Error('No refresh token received');
saveToken(tokens.refresh_token);
return NextResponse.redirect(new URL('/sync', process.env.NEXT_PUBLIC_BASE_URL));
```

**Add `.portfolio-config.json` to `.gitignore`** — critical, do this first.

**New file: `app/setup/page.tsx`** — three-step status page:
- Step 1: App is running ✓ (always green)
- Step 2: Gmail — "Connect Gmail" button if not connected, green ✓ if connected
- Step 3: Sync — link to `/sync` once Gmail is connected

Reads `/api/gmail/sync` GET for connection status (already exists).

**Test:** `lib/config.test.ts` — `getStoredToken()` returns null when file absent; returns token when file exists; `saveToken()` writes correctly.

---

## Execution order for Batch 4

```
#12  →  #11  →  #10  →  #9  →  #8
CSV     Movers   Manual   Mobile  Onboarding
30m     90m      90m      60m     2h
```

Each can be committed independently. Don't batch them into one PR.
