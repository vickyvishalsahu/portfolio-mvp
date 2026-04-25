# Leila's Product Brief — Portfolio MVP
*First assessment · April 2026*

---

Before I give you my take, one question I always ask first:

> *"Who is feeling this pain, and what are they doing right now instead of using this?"*

You answered it yourself: **expats**. Specifically — someone with money split across a home country and a host country, two different brokers, two different currencies, two different tax systems, and zero consolidated view. Right now they're either ignoring it, using a spreadsheet, or switching between apps and doing mental currency math. That's the pain. That's real.

---

## The Honest Take

**The pipeline is genuinely clever.** Gmail → Claude → SQLite is an elegant shortcut. No CSV exports, no manual entry, no bank API agreements. For a personal tool, it's the right call. Kai built the hard part.

**But this is a developer tool, not a product yet.** The gap between "it works" and "someone other than you can use it" is the entire product problem right now.

---

### What's actually valuable (and not being communicated)

The single most important thing this product has — and it's not being said anywhere — is this:

> **Your data never leaves your device.**

This is local-first. SQLite on your machine. No cloud, no account, no server with your net worth on it. In Europe, after every data breach headline, after GDPR trained people to ask "where does my data go?" — this is a massive trust signal. And it's invisible. Nobody knows. The UI doesn't say it once.

This is your moat. Right now it's buried.

---

### The first 10 minutes are broken

The OAuth token copy-paste flow is the product's biggest enemy. Someone reads about this, gets excited, tries it, opens the app, sees "Connect Gmail", clicks it, authorizes — and then lands on a page that says *copy this token and paste it into `.env.local` and restart your server.* That's where 90% of non-developers leave and never come back.

Even for a personal tool, even if you're the only user right now — the setup experience is how you validate whether this is worth building further. If you can't get a friend to set it up, the idea isn't testable.

---

### The core value isn't surfaced

Right now the app tells you your total value in EUR and your P&L. That's a portfolio tracker. But the real value for an expat is different:

*"I have ₹8 lakhs in Zerodha, €12,000 in Scalable Capital, and 0.04 BTC on Binance. What am I actually worth in EUR today?"*

That sentence — that specific pain — is not answered clearly anywhere in the current UI. The dashboard gets close, but it doesn't say it loudly. The number at the top should feel like the answer to that exact question.

---

### The time dimension is missing

A snapshot of your net worth is mildly interesting. A trend of your net worth is emotionally compelling. Right now the app has no memory. Every time you open it, it's just *now*. There's no "you're up €2,400 since last month." That delta is what people actually come back for. Without it, there's no reason to open the app daily.

---

### Tax is the untouched elephant

For an expat, tax is the most anxious part of having money in two countries. Germany's Abgeltungsteuer kicks in on capital gains. India's LTCG/STCG rules are different. The data to calculate this exposure already exists in the transactions table — holding period, buy price, current price. The app doesn't touch it at all. That's an enormous missed opportunity. Even a rough indicator ("you have unrealised gains that may be LTCG-eligible in India") would be genuinely valuable.

---

### What Kai flagged about the sell bug

This matters more than it looks. If a sell transaction arrives before its matching buy (which happens if you sync from a date mid-history), the P&L calculation breaks silently. The user sees a wrong number and doesn't know why. In financial products, a wrong number destroys trust immediately. This needs to be fixed before anything else.

---

## What I'd Build Next — Prioritised

**The 2×2: Impact on trust × Effort**

### Ship first (high trust, low effort)

**1. Surface the "local-first" trust signal**
One line on the dashboard footer or the sync page: *"Your data stays on your device. Nothing is sent to any server except during Gmail sync and price lookups."* Zero engineering. Massive trust signal. Do it today.

**2. Fix the sell bug**
Kai flagged it. A wrong P&L number is a trust breach. Fix before showing this to anyone.

**3. Net worth delta**
Save a daily snapshot of total portfolio value to a new `snapshots` table. Show on dashboard: *"€47,234 · ↑ €1,200 vs last month."* One table, one insert per visit, one number on screen. The single highest-value feature for daily re-engagement.

---

### Build next (high value, medium effort)

**4. Portfolio value chart (time series)**
Once snapshots exist, plot them. A simple line chart of net worth over time. This is the feature that makes people open the app every morning.

**5. Broker breakdown**
The allocation chart shows asset types. It should also show brokers. An expat wants to see: 40% Zerodha, 45% Scalable, 15% Binance. That's the question they're actually asking.

**6. Guided onboarding — replace the token copy-paste**
Build a proper `/setup` page that walks through the OAuth flow, detects the token from the callback, stores it automatically, and tells you you're ready. Removes the terminal dependency entirely.

**7. Mobile-responsive layout**
People check their portfolio on their phone at night. The tables break on mobile. The emotional check-in behavior — the 2am portfolio look — happens on a phone. If the app doesn't work there, you're missing the highest-frequency use case.

---

### Design for now, build later (future hooks)

**8. Tax exposure view**
Unrealised gains split by jurisdiction (EUR assets vs INR assets), holding period flag (LTCG-eligible vs short term). Don't build a tax calculator — just surface the data. Let the user do the math.

**9. Manual transaction entry**
Not everyone uses the 5 hardcoded brokers. A simple form to add a transaction manually unlocks a huge chunk of users that the email pipeline can't reach. It also fixes the parse-error data loss problem.

**10. Export (GDPR hygiene)**
Under GDPR Article 20, users have the right to data portability. A CSV export of transactions is not optional if this ever goes beyond personal use.

---

## What You Might Be Missing

**The "explain yourself" problem.** When you open the app after not checking for a week and your portfolio is down €800, you want to know *why*. Which position moved? What changed? Right now the app has no answer to that. A simple "biggest movers" section would address it.

**The multi-currency confusion.** Everything is shown in EUR, which is correct for a Berlin-based expat. But the user thinks about their Indian holdings in INR. Showing a secondary value in original currency — *"€8,400 (₹7.6L)"* — would make the Indian positions feel more legible.

**The empty parse error experience.** Right now if Claude can't parse an email, it shows up in the "errors" list on the sync page and that transaction is gone. There's no way to recover it. That email contains a real trade. Losing it silently is unacceptable in a financial product. At minimum, the error state should say "this transaction needs manual review" and give the user a path to enter it.

**The refresh price UX.** The "Refresh Prices" button gives no feedback on staleness. The user doesn't know if they're looking at prices from 2 minutes ago or 3 hours ago. Show the last updated timestamp next to it.

---

## The Regulatory Flags (Europe-specific)

**Gmail scope.** You're requesting `gmail.readonly`. That grants access to the user's entire Gmail inbox — not just broker emails. The filtering happens client-side after fetch. A German user who understands GDPR will ask: *"Why does this app need to read all my emails?"* You need a clear explanation at the consent step of exactly what data is accessed and why. This isn't optional in Europe.

**Data retention.** The raw email body is stored in SQLite. That includes personal financial data. There's no retention policy, no way to delete it, no way to understand what's stored. For a personal tool this is fine. The moment a second user exists, you need a data retention policy.

**If this ever becomes a product:** MiFID II kicks in the moment you provide "investment information" to users. Tax guidance crosses into financial advice territory in Germany. Keep the product descriptive (here's your data) not prescriptive (here's what you should do) until you understand where that line sits with BaFin.

---

## The Core Problem We're Solving

*Right now in one sentence:*

> A retail investor with accounts at 2–3 brokers has no single place to see their full financial picture in real time — they're switching between apps and spreadsheets, converting currencies in their head, and guessing at their overall P&L.

*What we've built:* A working answer to that problem, for a technically capable single user, with Gmail as the data source and Claude as the intelligence layer.

*What we haven't built:* Anything that works for someone who doesn't want to touch a terminal.

---

*The core is sound. The pipeline is real. The expat pain is real. What's missing is the product layer that makes it feel trustworthy and emotionally resonant — not just technically correct. The next 3 things: surface the local-first story, fix the sell bug, add the net worth delta. Everything else follows from those.*
