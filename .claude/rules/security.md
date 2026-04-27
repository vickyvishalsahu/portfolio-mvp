# Frontend Security Rules

These rules are ALWAYS enforced.

## Pre-Commit Checks

Before any commit, verify:

1. **No hardcoded secrets** — no API keys, passwords, or tokens in source code
2. **No `.env` files committed** — check `.gitignore` covers all env files
3. **No sensitive data in logs** — no tokens or user data in `console.log`
4. **No `dangerouslySetInnerHTML`** — unless input is sanitized with DOMPurify
5. **No `eval()` or `new Function()`** — never with user input

## Forbidden Patterns

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-...";
const password = "secret123";

// NEVER: Unsanitized HTML rendering
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// NEVER: Sensitive data in localStorage without encryption
localStorage.setItem("token", sensitiveToken);

// NEVER: Dynamic code execution with user input
eval(userProvidedCode);

// NEVER: HTTP URLs for API calls
const API_URL = "http://api.example.com";
```

## Required Patterns

```typescript
// ALWAYS: Environment variables for config
const apiUrl = import.meta.env.VITE_API_URL;

// ALWAYS: HTTPS for external URLs
const API_URL = "https://api.example.com";

// ALWAYS: Validate redirect URLs
const isValidRedirect = (url: string) => url.startsWith("/");

// ALWAYS: Use getApi() for authenticated requests (handles tokens via interceptors)
const api = getApi(url);
```

## When Vulnerability Found

1. STOP current work
2. Report with severity level
3. Fix before continuing
4. Check for similar patterns elsewhere
