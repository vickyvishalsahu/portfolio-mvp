# Email Fetching — Technical Overview

> **Kai + Mr. Wolf:** Here's the full breakdown of how the fetching domain works right now.

---

## Domain structure

The fetching logic now lives entirely in `domains/email-sync/`:

| File | Responsibility |
|---|---|
| `domains/email-sync/client.ts` | OAuth client, `getAuthenticatedClient()`, `fetchBrokerEmails()` |
| `domains/email-sync/utils.ts` | `buildSearchQuery()`, `mergeCustomDomains()`, body decoding helpers |
| `domains/email-sync/db.ts` | Raw email CRUD + broker settings (selected IDs, custom domains) |
| `domains/email-sync/constants.ts` | `GMAIL_SCOPES`, `DEFAULT_MAX_RESULTS`, `GLOBAL_SUBJECT_KEYWORDS` |
| `domains/email-sync/hooks/useGmailSync.ts` | Gmail status + fetch trigger state |
| `domains/email-sync/hooks/useBrokerSettings.ts` | Broker selection + custom domain state |
| `app/api/gmail/` + `app/api/settings/brokers/` | Thin API route wrappers |
| `domains/shared/constants.ts` | `BROKER_CATALOG` (shared with parser domain) |
| `domains/shared/types.ts` | `BrokerDefinition`, `FetchedEmail`, `RawEmail` |

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

The query is built dynamically in `domains/email-sync/utils.ts: buildSearchQuery()` based on which brokers the user selected.

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

Defined globally in `GLOBAL_SUBJECT_KEYWORDS` (`domains/email-sync/constants.ts`):
```
confirmation, contract note, purchase, SIP, bought, sold, order, execution, transaction, allotment, redemption
```

Brokers can extend this with `subjectKeywords?: string[]` on their definition (none currently use this).

### Custom domains (user-defined)

Users can add extra sender domains per broker via the Sync page UI. These are stored in the `settings` table as `broker_custom_domains` (JSON blob). At sync time, `mergeCustomDomains()` (`domains/email-sync/utils.ts`) merges them into the broker definitions before building the query.

---

## Fetch flow (step by step)

```
POST /api/gmail/sync

1. Guard: GOOGLE_REFRESH_TOKEN present?  →  400 if not
2. Guard: at least one broker selected?  →  400 if not
3. Read selected broker IDs  →  getSelectedBrokerIds() [email-sync/db.ts]
4. Read custom domains       →  getBrokerCustomDomains() [email-sync/db.ts]
5. Merge custom domains      →  mergeCustomDomains() [email-sync/utils.ts]
6. Call fetchBrokerEmails(brokers, maxResults=100)  [email-sync/client.ts]
   a. buildSearchQuery()  →  sender OR + subject OR, AND-ed together
   b. gmail.users.messages.list({ q, maxResults: 100 })  →  list of { id, threadId }
   c. For each ID: gmail.users.messages.get({ format: 'full' })
      - Extract headers: From, Subject, Date  →  getHeader() [email-sync/utils.ts]
      - Decode body: prefers text/plain, falls back to text/html, recurses into parts
        →  extractBody() + decodeBase64Url() [email-sync/utils.ts]
      - Body truncated at 10,000 chars before storing
   d. Returns FetchedEmail[]
7. For each email: insertRawEmail()  [email-sync/db.ts]  (INSERT OR IGNORE — deduplicates)
8. Return: { fetched, new, total_raw, total_parsed }
```

---

## Raw email storage

Stored in `raw_emails` table (schema owned by `domains/shared/db.ts`):

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
  ├── domains/email-sync/hooks/useGmailSync.ts
  │     └── POST /api/gmail/sync
  │           ├── domains/email-sync/db.ts     (getSelectedBrokerIds, getBrokerCustomDomains, insertRawEmail)
  │           ├── domains/shared/utils.ts      (getBrokersByIds)
  │           ├── domains/email-sync/utils.ts  (mergeCustomDomains)
  │           └── domains/email-sync/client.ts (fetchBrokerEmails)
  │                 ├── domains/email-sync/utils.ts  (buildSearchQuery, extractBody, getHeader)
  │                 └── googleapis               (OAuth2, gmail.users.messages.list/get)
  └── domains/email-sync/hooks/useBrokerSettings.ts
        └── GET/PUT /api/settings/brokers
              ├── domains/shared/constants.ts  (BROKER_CATALOG)
              └── domains/email-sync/db.ts     (getSelectedBrokerIds, setSelectedBrokerIds, ...)
```
