# TODO — Portfolio MVP

> Maintained by Mr. Wolf + Kai. Reviewed by Leila.
> Architecture brief for Kai: `.claude/kai-architecture-brief.md`
> Product brief from Leila: `.claude/leila-product-brief.md`
>
> **How to use:** Check off when shipped to `dev`. Add new tasks under the right section. Move done items to ✅ Done with the date.

---

## 🟢 Batch 4 — New Flows
*Do in this order: #12 → #11 → #10 → #9 → #8*

- [ ] **#12 CSV export** · new `app/api/export/route.ts`, `app/holdings/page.tsx`
  GET route, uses existing `getAllTransactions()`. No library — build CSV string manually. Export button as `<a download>`. Filename includes date.

- [ ] **#11 Biggest movers** · `lib/db.ts`, `lib/prices.ts`, `lib/holdings.ts`, `types/index.ts`, `app/page.tsx`
  Add `prev_price_eur` to `price_cache` schema. Save previous price in `setCachedPrice()` before overwriting. Add `prev_value_eur` to `Holding` type. Dashboard: Top 3 up / down by EUR change. Only show when prev prices exist.

- [ ] **#10 Manual transaction entry** · new `app/transactions/new/page.tsx`, new `app/api/transactions/route.ts`, `app/layout.tsx`, `app/sync/page.tsx`
  Form for manual trade entry. Uses existing `insertTransaction()` with `email_id: 'manual'`. Nav link. Parse error list gets "Add manually →" link — closes the loop Leila flagged.

- [ ] **#9 Mobile responsive** · `app/layout.tsx`, `app/page.tsx`, `app/holdings/page.tsx`, `app/sync/page.tsx`
  CSS sweep only. Holdings: `overflow-x-auto` + stacked header. Nav: `flex-wrap`. Sync: `flex-wrap` on button row. Chart heights: smaller on mobile. Test at 375px.

- [ ] **#8 Guided onboarding** · new `lib/config.ts`, `lib/gmail.ts`, `app/api/gmail/callback/route.ts`, new `app/setup/page.tsx`, `.gitignore`
  Store refresh token to `.portfolio-config.json` on callback. No more `.env.local` editing. Three-step setup page. Most complex task in the batch — read the architecture brief fully before starting.

---

## ✅ Done — Batch 1 (April 2026)

- [x] **#1 Fix sell P&L bug** — `lib/holdings.ts` · `Math.max(0, ...)` clamp, 8 TDD tests
- [x] **#2 Local-first trust signal** — `app/layout.tsx` · footer on every page
- [x] **#13 Gmail scope transparency** — `app/sync/page.tsx` · callout before Connect button
- [x] **#6 Price freshness timestamp** — holdings page shows "Prices: N min ago" + failed tickers in amber
- [x] **#7 Secondary currency** — INR/USD holdings show `₹7.6L` below EUR value

## ✅ Done — Batch 2–3 (April 2026)

- [x] **#3 Daily snapshots + net worth delta** — new `snapshots` table + `lib/snapshots.ts`, 10 TDD tests, "↑ €1,200 vs 30d ago" on dashboard
- [x] **#4 Portfolio value chart** — Recharts line chart, shows when 2+ snapshots exist
- [x] **#5 Broker breakdown** — By Type / By Broker toggle on allocation chart
