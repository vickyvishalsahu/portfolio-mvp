import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted by Vitest before any imports
// ---------------------------------------------------------------------------

// Mutable rows so each test can set its own transaction data
let mockRows: Record<string, unknown>[] = [];

vi.mock('@/lib/db', () => ({
  getDb: () => ({
    prepare: () => ({ all: () => mockRows }),
  }),
}));

// Prices: always return €100 per unit for simplicity
vi.mock('@/lib/prices', () => ({
  getPrice: vi.fn().mockResolvedValue({
    priceEur: 100,
    priceLocal: 100,
    currency: 'EUR',
  }),
}));

// Currency: EUR pass-through (amount unchanged)
vi.mock('@/lib/currency', () => ({
  convertToEur: vi.fn((amount: number) => Promise.resolve(amount)),
}));

// ---------------------------------------------------------------------------
// Import after mocks are registered
// ---------------------------------------------------------------------------
import { computeHoldings } from './holdings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeTx(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    ticker: 'AAPL',
    name: 'Apple Inc',
    asset_type: 'stock',
    currency: 'EUR',
    broker: 'scalable',
    quantity: 10,
    price: 10,
    transaction_type: 'buy',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('computeHoldings', () => {

  beforeEach(() => { mockRows = []; });

  it('simple buy — creates holding with correct qty and avg cost', async () => {
    mockRows = [makeTx({ quantity: 10, price: 10 })];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(10);
    expect(holdings[0].avg_cost_eur).toBe(10);
    expect(holdings[0].current_value_eur).toBe(1000); // 10 qty × €100 current price
  });

  it('partial sell — reduces qty and adjusts cost proportionally', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 4,  price: 15, transaction_type: 'sell' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(6);
    expect(holdings[0].avg_cost_eur).toBeCloseTo(10); // avg cost doesn't change on a sell
  });

  it('full sell — position is removed from holdings', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 10, price: 20, transaction_type: 'sell' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(0);
  });

  it('oversell — qty never goes negative, position is skipped', async () => {
    // THE BUG: sell more than was ever bought
    mockRows = [
      makeTx({ quantity: 5,  price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 20, price: 15, transaction_type: 'sell' }),
    ];

    const holdings = await computeHoldings();

    // Position should be excluded — not shown with qty=-15 and garbage P&L
    expect(holdings).toHaveLength(0);
  });

  it('oversell then rebuy — state resets cleanly, avg cost reflects only new buy', async () => {
    // After overselling, a subsequent buy should start from a clean slate
    mockRows = [
      makeTx({ quantity: 5,  price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 20, price: 15, transaction_type: 'sell' }),  // oversell
      makeTx({ quantity: 8,  price: 12, transaction_type: 'buy' }),   // fresh buy
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(8);
    expect(holdings[0].avg_cost_eur).toBeCloseTo(12); // only the fresh buy counts
  });

  it('sell with no prior buy — position is skipped gracefully, no crash', async () => {
    mockRows = [
      makeTx({ quantity: 5, price: 15, transaction_type: 'sell' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(0);
  });

  it('dividend — does not affect qty or cost', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10,   transaction_type: 'buy' }),
      makeTx({ quantity: 1,  price: 0.50, transaction_type: 'dividend' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(10);
    expect(holdings[0].avg_cost_eur).toBe(10);
  });

  it('multiple buys — avg cost weighted correctly', async () => {
    // Buy 10 @ €10 then 10 @ €20 → avg = €15
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 10, price: 20, transaction_type: 'buy' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(20);
    expect(holdings[0].avg_cost_eur).toBeCloseTo(15);
  });

});
