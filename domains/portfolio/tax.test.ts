import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Holding } from '@/domains/shared/types';

// ---------------------------------------------------------------------------
// Mocks — hoisted before imports
// ---------------------------------------------------------------------------

let mockHoldings: Partial<Holding>[] = [];
let mockEarliestDates: Record<string, string> = {};

vi.mock('./holdings', () => ({
  computeHoldings: vi.fn(async () => ({ holdings: mockHoldings, orphanedSells: [] })),
}));

vi.mock('@/domains/shared/db', () => ({
  getEarliestBuyDates: vi.fn(() => mockEarliestDates),
}));

import { computeTaxHoldings } from './tax';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date('2026-05-22');

const daysAgo = (days: number): string => {
  const date = new Date(TODAY);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const makeHolding = (overrides: Partial<Holding> = {}): Partial<Holding> => ({
  ticker: 'TEST',
  name: 'Test Holding',
  assetType: 'stock',
  currency: 'INR',
  broker: 'zerodha',
  quantity: 10,
  avgCostLocal: 100,
  currentValueLocal: 150,
  currentValueEur: 1.8,
  avgCostEur: 1.2,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeTaxHoldings', () => {

  beforeEach(() => {
    mockHoldings = [];
    mockEarliestDates = {};
    vi.setSystemTime(TODAY);
  });

  it('INR stock held 400 days → LTCG in India section', async () => {
    mockHoldings = [makeHolding({ ticker: 'RELIANCE', broker: 'zerodha', currency: 'INR', assetType: 'stock' })];
    mockEarliestDates = { RELIANCE: daysAgo(400) };

    const { india } = await computeTaxHoldings();

    expect(india).toHaveLength(1);
    expect(india[0].taxClass).toBe('LTCG');
    expect(india[0].jurisdiction).toBe('IN');
  });

  it('INR stock held 200 days → STCG in India section', async () => {
    mockHoldings = [makeHolding({ ticker: 'RELIANCE', broker: 'zerodha', currency: 'INR', assetType: 'stock' })];
    mockEarliestDates = { RELIANCE: daysAgo(200) };

    const { india } = await computeTaxHoldings();

    expect(india[0].taxClass).toBe('STCG');
  });

  it('INR crypto held any duration → FLAT_30 in India section', async () => {
    mockHoldings = [makeHolding({ ticker: 'BTC', broker: 'zerodha', currency: 'INR', assetType: 'crypto' })];
    mockEarliestDates = { BTC: daysAgo(500) };

    const { india } = await computeTaxHoldings();

    expect(india[0].taxClass).toBe('FLAT_30');
  });

  it('EUR stock held 200 days → TAXABLE in Germany section', async () => {
    mockHoldings = [makeHolding({ ticker: 'VOW3', broker: 'scalable', currency: 'EUR', assetType: 'stock' })];
    mockEarliestDates = { VOW3: daysAgo(200) };

    const { germany } = await computeTaxHoldings();

    expect(germany).toHaveLength(1);
    expect(germany[0].taxClass).toBe('TAXABLE');
    expect(germany[0].jurisdiction).toBe('DE');
  });

  it('EUR crypto held 400 days → TAX_FREE in Germany section', async () => {
    mockHoldings = [makeHolding({ ticker: 'ETH', broker: 'scalable', currency: 'EUR', assetType: 'crypto' })];
    mockEarliestDates = { ETH: daysAgo(400) };

    const { germany } = await computeTaxHoldings();

    expect(germany[0].taxClass).toBe('TAX_FREE');
  });

  it('EUR crypto held 200 days → TAXABLE in Germany section', async () => {
    mockHoldings = [makeHolding({ ticker: 'ETH', broker: 'scalable', currency: 'EUR', assetType: 'crypto' })];
    mockEarliestDates = { ETH: daysAgo(200) };

    const { germany } = await computeTaxHoldings();

    expect(germany[0].taxClass).toBe('TAXABLE');
  });

  it('crypto broker holding appears in both India and Germany sections', async () => {
    mockHoldings = [makeHolding({ ticker: 'BTC', broker: 'binance', currency: 'USD', assetType: 'crypto' })];
    mockEarliestDates = { BTC: daysAgo(400) };

    const { india, germany, hasDualJurisdiction } = await computeTaxHoldings();

    expect(india).toHaveLength(1);
    expect(india[0].taxClass).toBe('FLAT_30');
    expect(germany).toHaveLength(1);
    expect(germany[0].taxClass).toBe('TAX_FREE');
    expect(hasDualJurisdiction).toBe(true);
  });

  it('coinbase holding also triggers dual jurisdiction', async () => {
    mockHoldings = [makeHolding({ ticker: 'ETH', broker: 'coinbase', currency: 'USD', assetType: 'crypto' })];
    mockEarliestDates = { ETH: daysAgo(200) };

    const { india, germany } = await computeTaxHoldings();

    expect(india[0].taxClass).toBe('FLAT_30');
    expect(germany[0].taxClass).toBe('TAXABLE');
  });

  it('holding with no buy transactions in DB is excluded', async () => {
    mockHoldings = [makeHolding({ ticker: 'MYSTERY', broker: 'zerodha' })];
    mockEarliestDates = {}; // no entry for MYSTERY

    const { india, germany } = await computeTaxHoldings();

    expect(india).toHaveLength(0);
    expect(germany).toHaveLength(0);
  });

  it('unrealisedGain = currentValueLocal - avgCostLocal × quantity', async () => {
    mockHoldings = [makeHolding({ ticker: 'RELIANCE', broker: 'zerodha', quantity: 10, avgCostLocal: 100, currentValueLocal: 1500 })];
    mockEarliestDates = { RELIANCE: daysAgo(400) };

    const { india } = await computeTaxHoldings();

    expect(india[0].unrealisedGain).toBe(500); // 1500 - (100 * 10)
  });

  it('holdingDays is computed correctly from earliest buy date', async () => {
    mockHoldings = [makeHolding({ ticker: 'RELIANCE', broker: 'zerodha' })];
    mockEarliestDates = { RELIANCE: daysAgo(300) };

    const { india } = await computeTaxHoldings();

    expect(india[0].holdingDays).toBe(300);
  });

  it('unknown broker is excluded from both sections', async () => {
    mockHoldings = [makeHolding({ ticker: 'XYZ', broker: 'unknown_broker' })];
    mockEarliestDates = { XYZ: daysAgo(100) };

    const { india, germany } = await computeTaxHoldings();

    expect(india).toHaveLength(0);
    expect(germany).toHaveLength(0);
  });

  it('hasDualJurisdiction is false when no crypto broker holdings', async () => {
    mockHoldings = [makeHolding({ ticker: 'RELIANCE', broker: 'zerodha' })];
    mockEarliestDates = { RELIANCE: daysAgo(400) };

    const { hasDualJurisdiction } = await computeTaxHoldings();

    expect(hasDualJurisdiction).toBe(false);
  });

});
