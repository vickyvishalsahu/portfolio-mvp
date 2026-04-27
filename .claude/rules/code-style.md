# Code Style

## Function declarations

Always use arrow functions assigned to `const`. Never use `function` keyword declarations.

```typescript
// CORRECT
const handleSync = async () => { ... };
const computeHoldings = async (): Promise<Holding[]> => { ... };
const formatDate = (date: string) => date.slice(0, 10);

// WRONG
async function handleSync() { ... }
function formatDate(date: string) { ... }
```

**If call order matters**, define the function before its first use — that's the right fix, not reaching for `function` hoisting.

Only fall back to the `function` keyword when arrow syntax is genuinely impossible (e.g., generator functions).
