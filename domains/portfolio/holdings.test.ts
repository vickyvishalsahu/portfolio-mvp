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

    const { holdings } = await computeHoldings();

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

    const { holdings } = await computeHoldings();

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

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(6);
    expect(holdings[0].avgCostEur).toBeCloseTo(10);
  });

  it('full sell — position is removed from holdings', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 10, price: 20, transaction_type: 'sell' }),
    ];

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(0);
  });

  it('oversell — qty never goes negative, position is skipped', async () => {
    mockRows = [
      makeTx({ quantity: 5,  price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 20, price: 15, transaction_type: 'sell' }),
    ];

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(0);
  });

  it('oversell then rebuy — state resets cleanly, avg cost reflects only new buy', async () => {
    mockRows = [
      makeTx({ quantity: 5,  price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 20, price: 15, transaction_type: 'sell' }),
      makeTx({ quantity: 8,  price: 12, transaction_type: 'buy' }),
    ];

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(8);
    expect(holdings[0].avgCostEur).toBeCloseTo(12);
  });

  it('sell with no prior buy — position is skipped, ticker in orphanedSells', async () => {
    mockRows = [
      makeTx({ quantity: 5, price: 15, transaction_type: 'sell' }),
    ];

    const { holdings, orphanedSells } = await computeHoldings();

    expect(holdings).toHaveLength(0);
    expect(orphanedSells).toContain('AAPL');
  });

  it('sell arrives before matching buy — qty correctly accounts for the debt', async () => {
    mockRows = [
      makeTx({ quantity: 5,  price: 15, transaction_type: 'sell' }),
      makeTx({ quantity: 10, price: 12, transaction_type: 'buy' }),
    ];

    const { holdings, orphanedSells } = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(5);
    expect(holdings[0].avgCostEur).toBeCloseTo(12);
    expect(orphanedSells).toHaveLength(0);
  });

  it('sell debt fully absorbed by buy — not in orphanedSells', async () => {
    mockRows = [
      makeTx({ quantity: 5,  price: 15, transaction_type: 'sell' }),
      makeTx({ quantity: 5,  price: 12, transaction_type: 'buy' }),
    ];

    const { holdings, orphanedSells } = await computeHoldings();

    expect(holdings).toHaveLength(0);
    expect(orphanedSells).toHaveLength(0);
  });

  it('sell debt partially absorbed — ticker remains in orphanedSells', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 15, transaction_type: 'sell' }),
      makeTx({ quantity: 5,  price: 12, transaction_type: 'buy' }),
    ];

    const { holdings, orphanedSells } = await computeHoldings();

    expect(holdings).toHaveLength(0);
    expect(orphanedSells).toContain('AAPL');
  });

  it('clean buy-sell history — orphanedSells is empty', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 4,  price: 15, transaction_type: 'sell' }),
    ];

    const { orphanedSells } = await computeHoldings();

    expect(orphanedSells).toHaveLength(0);
  });

  it('dividend — does not affect qty or cost', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10,   transaction_type: 'buy' }),
      makeTx({ quantity: 1,  price: 0.50, transaction_type: 'dividend' }),
    ];

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(10);
    expect(holdings[0].avgCostEur).toBe(10);
  });

  it('multiple buys — avg cost weighted correctly', async () => {
    mockRows = [
      makeTx({ quantity: 10, price: 10, transaction_type: 'buy' }),
      makeTx({ quantity: 10, price: 20, transaction_type: 'buy' }),
    ];

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(20);
    expect(holdings[0].avgCostEur).toBeCloseTo(15);
  });

  it('prevValueEur is null when no previous price exists', async () => {
    mockRows = [makeTx({ quantity: 10, price: 10 })];
    mockPrevPriceEur = null;

    const { holdings } = await computeHoldings();

    expect(holdings[0].prevValueEur).toBeNull();
  });

  it('prevValueEur is qty × prevPriceEur when previous price exists', async () => {
    mockRows = [makeTx({ quantity: 10, price: 10 })];
    mockPrevPriceEur = 80;

    const { holdings } = await computeHoldings();

    expect(holdings[0].prevValueEur).toBe(800);
  });

  it('prevValueLocal is null when no prevPriceLocal in cache', async () => {
    mockRows = [makeTx({ quantity: 10, price: 130, currency: 'INR' })];
    mockPrevPriceLocal = null;

    const { holdings } = await computeHoldings();

    expect(holdings[0].prevValueLocal).toBeNull();
  });

  it('prevValueLocal is qty × prevPriceLocal when it exists', async () => {
    mockRows = [makeTx({ quantity: 100, price: 130, currency: 'INR' })];
    mockPrevPriceLocal = 145;

    const { holdings } = await computeHoldings();

    expect(holdings[0].prevValueLocal).toBe(14500);
  });

  it('same ticker, conflicting asset_type — majority wins', async () => {
    mockRows = [
      makeTx({ ticker: 'ASHOKA', asset_type: 'stock', quantity: 5 }),
      makeTx({ ticker: 'ASHOKA', asset_type: 'stock', quantity: 5 }),
      makeTx({ ticker: 'ASHOKA', asset_type: 'mf', quantity: 5 }),
    ];

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].assetType).toBe('stock');
    expect(holdings[0].quantity).toBe(15);
  });

  it('asset_type tie — equity label wins over mf', async () => {
    mockRows = [
      makeTx({ ticker: 'ASHOKA', name: 'Ashoka Buildcon Ltd', asset_type: 'mf', quantity: 5 }),
      makeTx({ ticker: 'ASHOKA', name: 'Ashoka Buildcon Ltd', asset_type: 'stock', quantity: 5 }),
    ];

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].assetType).toBe('stock');
  });

  it('null tickers, names differ only by whitespace/case — merged into one holding', async () => {
    mockRows = [
      makeTx({ ticker: null, name: 'HDFC Large Cap Fund - Regular Plan', asset_type: 'mf', quantity: 100 }),
      makeTx({ ticker: null, name: 'hdfc large cap fund - regular plan', asset_type: 'mf', quantity: 50 }),
    ];

    const { holdings } = await computeHoldings();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].quantity).toBe(150);
    expect(holdings[0].assetType).toBe('mf');
  });

});
