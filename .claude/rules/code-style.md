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

## Conditional rendering

Never inline ternaries or early-returns directly inside a component's `return`. Extract them into a named render function so the main return stays flat and readable.

```tsx
// CORRECT
const MyComponent = (props) => {
  const renderContent = () => {
    if (!props.data) return <p>Loading...</p>;
    return <ActualContent data={props.data} />;
  };

  return (
    <div className="wrapper">
      {renderContent()}
    </div>
  );
};

// WRONG — condition baked into the return
const MyComponent = (props) => (
  <div className="wrapper">
    {!props.data ? <p>Loading...</p> : <ActualContent data={props.data} />}
  </div>
);
```

Name the render function after what it renders: `renderCatalog`, `renderStats`, `renderError`.

## Variable names

Always use descriptive, self-documenting names. Never use single-letter or abbreviated variables.

```tsx
// CORRECT
brokers.map((broker) => broker.id)
holdings.filter((holding) => holding.prev_value_local !== null)
setForm((prevForm) => ({ ...prevForm, [field]: value }))
.then((response) => response.json())
onChange={(event) => set('name', event.target.value)}
.sort((holdingA, holdingB) => holdingB.change - holdingA.change)

// WRONG
brokers.map((b) => b.id)
holdings.filter((h) => h.prev_value_local !== null)
setForm((f) => ({ ...f, [field]: value }))
.then((r) => r.json())
onChange={(e) => set('name', e.target.value)}
.sort((a, b) => b.change - a.change)
```

This applies everywhere: map/filter/reduce callbacks, event handlers, sort comparators, promise chains.

## Types vs interfaces

Always use `type`. Only use `interface` when declaration merging is explicitly required (e.g. extending third-party types).

```typescript
// CORRECT
type Props = { broker: BrokerDefinition; selected: boolean; };
type CachedPrice = { ticker: string; price_eur: number; };

// WRONG
interface Props { broker: BrokerDefinition; selected: boolean; }
interface CachedPrice { ticker: string; price_eur: number; }
```

## File size

Keep files small. Extract into a new file when a component, type, or constant can stand on its own — don't wait until a file feels "too big".

A component belongs in its own file when:
- It has its own props interface
- It could be reused or tested independently
- Keeping it co-located makes the parent file harder to scan

Co-locate files that belong together (e.g. `BrokerCard.tsx` next to `BrokerSelection.tsx`), but each component lives in its own file.

## Derived values in map callbacks

Never compute values inline inside JSX props. Derive them as `const`s at the top of the map callback so props read as plain names.

```tsx
// CORRECT
{items.map((item) => {
  const selected = selectedIds.includes(item.id);
  const expanded = expandedId === item.id;
  const activeRef = expanded ? inputRef : undefined;

  return <Card selected={selected} expanded={expanded} ref={activeRef} />;
})}

// WRONG — logic baked into props
{items.map((item) => (
  <Card
    selected={selectedIds.includes(item.id)}
    expanded={expandedId === item.id}
    ref={expandedId === item.id ? inputRef : undefined}
  />
))}
```
