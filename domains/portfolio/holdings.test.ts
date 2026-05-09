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
  getPrevPrice: vi.fn(() => ({ prevPriceEur: mockPrevPriceEur, prevPriceLocal: mockPrevPriceLocal })),
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
    expect(holdings[0].avgCostEur).toBe(10);
    expect(holdings[0].avgCostLocal).toBe(10);
    expect(holdings[0].currentValueEur).toBe(1000);
    expect(holdings[0].currentValueLocal).toBe(1000);
  });

  it('INR holding — local values use source price, not EUR conversion', async () => {
    const { getPrice } = await import('@/domains/pricing');
    vi.mocked(getPrice).mockResolvedValueOnce({ priceEur: 1.65, priceLocal: 150, currency: 'INR' });

    mockRows = [makeTx({ quantity: 100, price: 130, currency: 'INR', asset_type: 'mf' })];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].avgCostLocal).toBe(130);
    expect(holdings[0].currentPriceLocal).toBe(150);
    expect(holdings[0].currentValueLocal).toBe(15000);
    expect(holdings[0].pnlLocal).toBe(2000);
  });

  it('partial sell — reduces qty and adjusts cost proportionally', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 4,  price: 15, transaction_type: 'sell' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(6);
    expect(holdings[0].avgCostEur).toBeCloseTo(10);
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
    expect(holdings[0].avgCostEur).toBeCloseTo(12);
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
    expect(holdings[0].avgCostEur).toBe(10);
  });

  it('multiple buys — avg cost weighted correctly', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 10, price: 20, transaction_type: 'buy' }),
    ];

    const holdings = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(20);
    expect(holdings[0].avgCostEur).toBeCloseTo(15);
  });

  it('prevValueEur is null when no previous price exists', async () => {
    mockRows = [makeTx({ quantity: 10, price: 10 })];
    mockPrevPriceEur = null;

    const holdings = await computeHoldings();

    expect(holdings[0].prevValueEur).toBeNull();
  });

  it('prevValueEur is qty × prevPriceEur when previous price exists', async () => {
    mockRows = [makeTx({ quantity: 10, price: 10 })];
    mockPrevPriceEur = 80;

    const holdings = await computeHoldings();

    expect(holdings[0].prevValueEur).toBe(800);
  });

  it('prevValueLocal is null when no prevPriceLocal in cache', async () => {
    mockRows = [makeTx({ quantity: 10, price: 130, currency: 'INR' })];
    mockPrevPriceLocal = null;

    const holdings = await computeHoldings();

    expect(holdings[0].prevValueLocal).toBeNull();
  });

  it('prevValueLocal is qty × prevPriceLocal when it exists', async () => {
    mockRows = [makeTx({ quantity: 100, price: 130, currency: 'INR' })];
    mockPrevPriceLocal = 145;

    const holdings = await computeHoldings();

    expect(holdings[0].prevValueLocal).toBe(14500);
  });

});
