# Email Fetching — Technical Overview

> **Kai + Mr. Wolf:** Here's the full breakdown of how the fetching domain works right now.

---

## Is it a separate domain?

Loosely, yes — but not enforced by directory structure. The fetching logic lives in two places:

| Layer | File | Responsibility |
|---|---|---|
| Core lib | `lib/gmail.ts` | OAuth client, query builder, Gmail API calls, email decoding |
| API route | `app/api/gmail/sync/route.ts` | Orchestration: read broker config from DB → call lib → store raw emails |
| Broker catalog | `lib/brokers.ts` | All broker definitions + helper functions used by the query builder |

Auth endpoints (`/api/gmail/auth`, `/api/gmail/callback`) are thin wrappers — they only handle the OAuth handshake.

---

## Auth flow

One-time setup. Fully manual (personal tool, no prod auth needed).

```
GET /api/gmail/auth
  → generates OAuth URL (scope: gmail.readonly, access_type: offline, prompt: consent)
  → redirects browser to Google

GET /api/gmail/callback?code=...
  → exchanges code for tokens
  → renders refresh_token on screen
  → user pastes it into .env.local as GOOGLE_REFRESH_TOKEN
```

From then on, every sync call uses `getAuthenticatedClient()` which instantiates an OAuth2 client with only the stored `refresh_token`. Google auto-refreshes the access token on each request.

**Key detail:** The refresh token is stored in `.env.local`, not in the DB. No token rotation logic exists — if the token is revoked you go through the OAuth flow again manually.

---

## The Gmail query

The query is built dynamically in `lib/gmail.ts: buildSearchQuery()` based on which brokers the user selected.

### Structure

```
(from:zerodha.com OR from:zerodha.net OR from:scalable.capital OR ...) 
(subject:confirmation OR subject:contract note OR subject:purchase OR subject:SIP OR ...)
```

Both parts are `AND`-ed together by Gmail — an email must match **at least one sender** AND **at least one subject keyword**.

### Sender terms — two-tier system

Each `BrokerDefinition` has two separate domain lists:

```ts
senderDomains: string[]       // used by parser pre-filter (exact match)
gmailSearchTerms?: string[]   // used in Gmail query (defaults to senderDomains if absent)
```

Why the split? Gmail's `from:zerodha.com` is a **substring match** — it catches `noreply@kite.zerodha.com`, `alerts@zerodha.net`, etc. But the parser needs to know exactly which domains are legitimate so it can reject spoofed senders. So:

- `gmailSearchTerms` casts a wide net for the API query
- `senderDomains` is used downstream for strict validation

Example (Zerodha):
```ts
senderDomains: ['zerodha.com', 'kite.zerodha.com', 'zerodha.net'],
gmailSearchTerms: ['zerodha.com', 'zerodha.net'],  // broader — catches all subdomains
```

Example (21Bitcoin — routes through a 3rd party mailer):
```ts
senderDomains: ['fior.digital'],
gmailSearchTerms: ['fior.digital'],
```

### Subject keywords

Defined globally in `GLOBAL_SUBJECT_KEYWORDS`:
```
confirmation, contract note, purchase, SIP, bought, sold, order, execution, transaction, allotment, redemption
```

Brokers can extend this with `subjectKeywords?: string[]` on their definition (none currently use this).

### Custom domains (user-defined)

Users can add extra sender domains per broker via the Sync page UI. These are stored in the `settings` table as `broker_custom_domains` (JSON blob). At sync time, `mergeCustomDomains()` in the sync route merges them into the broker definitions before building the query.

---

## Fetch flow (step by step)

```
POST /api/gmail/sync

1. Guard: GOOGLE_REFRESH_TOKEN present?  →  400 if not
2. Guard: at least one broker selected?  →  400 if not
3. Read selected broker IDs from settings table
4. Read custom domains from settings table
5. Merge custom domains into broker definitions
6. Call fetchBrokerEmails(brokers, maxResults=100)
   a. Build Gmail search query (sender OR + subject OR, AND-ed together)
   b. gmail.users.messages.list({ q, maxResults: 100 })  →  list of { id, threadId }
   c. For each ID: gmail.users.messages.get({ format: 'full' })
      - Extract headers: From, Subject, Date
      - Decode body: prefers text/plain, falls back to text/html, recurses into parts
      - Body is truncated at 10,000 chars before storing
   d. Returns FetchedEmail[]
7. For each email: insertRawEmail (INSERT OR IGNORE — deduplicates by Gmail message ID)
8. Return: { fetched, new, total_raw, total_parsed }
```

---

## Raw email storage

Stored in `raw_emails` table:

```sql
CREATE TABLE raw_emails (
  id          TEXT PRIMARY KEY,   -- Gmail message ID (dedup key)
  sender      TEXT,
  subject     TEXT,
  body        TEXT,               -- truncated at 10k chars
  received_at TEXT,               -- ISO string from Date header
  parsed      INTEGER DEFAULT 0  -- 0 = pending, 1 = done
);
```

`INSERT OR IGNORE` means re-syncing is safe — already-fetched emails are skipped. The `parsed` flag is how the parse step knows what to process next.

---

## Current limitations / known gaps

| Issue | Impact |
|---|---|
| `maxResults=100` hard cap | Only fetches the 100 most recent matching emails. No pagination. |
| No date cursor / `after:` filter | Every sync re-fetches the same 100 most recent emails. Only deduplication prevents re-processing. |
| Sequential per-message fetch | `messages.get` is called one by one in a `for` loop — 100 emails = 100 API calls sequentially. No batching. |
| Body truncation at 10k chars | Long HTML emails from some brokers may be cut off before the transaction data. |
| Single-format extraction | `extractBody` returns the first non-empty part — it doesn't try both plain and HTML and pick the better one. |
| Refresh token in env file | Manual step to set up. If revoked, user has to redo OAuth and restart the server. |
| No rate limit handling | Gmail API has quota limits. No retry/backoff logic on 429s. |

---

## Dependency map

```
app/sync/page.tsx
  └── POST /api/gmail/sync
        ├── lib/db.ts          (getSelectedBrokerIds, getBrokerCustomDomains, insertRawEmail)
        ├── lib/brokers.ts     (getBrokersByIds, BROKER_CATALOG)
        └── lib/gmail.ts
              ├── lib/brokers.ts  (getGmailSearchTerms, getAllSubjectKeywords)
              └── googleapis      (OAuth2, gmail.users.messages.list/get)
```
