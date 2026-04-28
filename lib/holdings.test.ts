import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted by Vitest before any imports
// ---------------------------------------------------------------------------

let mockRows: Record<string, unknown>[] = [];
let mockPrevPriceEur: number | null = null;
let mockPrevPriceLocal: number | null = null;

vi.mock('@/domains/shared/db', () => ({
  getDb: () => ({
    prepare: () => ({
      all: () => mockRows,
    }),
  }),
}));

vi.mock('@/domains/pricing', () => ({
  getPrice: vi.fn().mockResolvedValue({
    priceEur: 100,
    priceLocal: 100,
    currency: 'EUR',
  }),
  convertToEur: vi.fn((amount: number) => Promise.resolve(amount)),
  getPrevPrice: vi.fn(() => ({ prev_price_eur: mockPrevPriceEur, prev_price_local: mockPrevPriceLocal })),
}));

// ---------------------------------------------------------------------------
// Import after mocks are registered
// ---------------------------------------------------------------------------
import { computeHoldings } from './holdings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeTx = (overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> => ({
  ticker: 'AAPL',
  name: 'Apple Inc',
  asset_type: 'stock',
  currency: 'EUR',
  broker: 'scalable',
  quantity: 10,
  price: 10,
  transaction_type: 'buy',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('computeHoldings', () => {

  beforeEach(() => { mockRows = []; mockPrevPriceEur = null; mockPrevPriceLocal = null; });

  it('simple buy — creates holding with correct qty and avg cost', async () => {
    mockRows = [makeTx({ quantity: 10, price: 10 })];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(10);
    expect(holdings[0].avg_cost_eur).toBe(10);
    expect(holdings[0].avg_cost_local).toBe(10);
    expect(holdings[0].current_value_eur).toBe(1000);
    expect(holdings[0].current_value_local).toBe(1000);
  });

  it('INR holding — local values use source price, not EUR conversion', async () => {
    const { getPrice } = await import('@/domains/pricing');
    vi.mocked(getPrice).mockResolvedValueOnce({ priceEur: 1.65, priceLocal: 150, currency: 'INR' });

    mockRows = [makeTx({ quantity: 100, price: 130, currency: 'INR', asset_type: 'mf' })];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].avg_cost_local).toBe(130);
    expect(holdings[0].current_price_local).toBe(150);
    expect(holdings[0].current_value_local).toBe(15000);
    expect(holdings[0].pnl_local).toBe(2000);
  });

  it('partial sell — reduces qty and adjusts cost proportionally', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 4,  price: 15, transaction_type: 'sell' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(6);
    expect(holdings[0].avg_cost_eur).toBeCloseTo(10);
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
    mockRows = [
      makeTx({ quantity: 5,  price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 20, price: 15, transaction_type: 'sell' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(0);
  });

  it('oversell then rebuy — state resets cleanly, avg cost reflects only new buy', async () => {
    mockRows = [
      makeTx({ quantity: 5,  price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 20, price: 15, transaction_type: 'sell' }),
      makeTx({ quantity: 8,  price: 12, transaction_type: 'buy' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(8);
    expect(holdings[0].avg_cost_eur).toBeCloseTo(12);
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
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 10, price: 20, transaction_type: 'buy' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(20);
    expect(holdings[0].avg_cost_eur).toBeCloseTo(15);
  });

  it('prev_value_eur is null when no previous price exists', async () => {
    mockRows = [makeTx({ quantity: 10, price: 10 })];
    mockPrevPriceEur = null;

    const holdings = await computeHoldings();

    expect(holdings[0].prev_value_eur).toBeNull();
  });

  it('prev_value_eur is qty × prev_price_eur when previous price exists', async () => {
    mockRows = [makeTx({ quantity: 10, price: 10 })];
    mockPrevPriceEur = 80;

    const holdings = await computeHoldings();

    expect(holdings[0].prev_value_eur).toBe(800);
  });

  it('prev_value_local is null when no prev_price_local in cache', async () => {
    mockRows = [makeTx({ quantity: 10, price: 130, currency: 'INR' })];
    mockPrevPriceLocal = null;

    const holdings = await computeHoldings();

    expect(holdings[0].prev_value_local).toBeNull();
  });

  it('prev_value_local is qty × prev_price_local when it exists', async () => {
    mockRows = [makeTx({ quantity: 100, price: 130, currency: 'INR' })];
    mockPrevPriceLocal = 145;

    const holdings = await computeHoldings();

    expect(holdings[0].prev_value_local).toBe(14500);
  });

});
