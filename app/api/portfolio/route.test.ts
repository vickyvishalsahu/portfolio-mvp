import { vi, describe, it, expect, beforeEach } from 'vitest';

// vi.mock is hoisted — mock data must be defined inline or via vi.fn()
vi.mock('@/domains/portfolio', () => ({ computeHoldings: vi.fn(), recordSnapshot: vi.fn() }));
vi.mock('@/domains/shared/db', () => ({
  getAllTransactions: vi.fn().mockReturnValue([{}, {}]),
  getPriceCacheAge: vi.fn().mockReturnValue(null),
}));

import { GET } from './route';
import { computeHoldings, recordSnapshot } from '@/domains/portfolio';

const TWO_INR_HOLDINGS = [
  {
    ticker: 'HDFC', name: 'HDFC MF', assetType: 'mf',
    quantity: 100, avgCostLocal: 130, avgCostEur: 1.44,
    currentPriceLocal: 150, currentPriceEur: 1.65,
    currentValueLocal: 15000, currentValueEur: 165,
    prevValueEur: null, prevValueLocal: null,
    pnl: 21, pnlLocal: 2000, pnlPct: 15.38,
    currency: 'INR', broker: 'cams',
  },
  {
    ticker: 'SBI', name: 'SBI MF', assetType: 'mf',
    quantity: 50, avgCostLocal: 200, avgCostEur: 2.21,
    currentPriceLocal: 9000, currentPriceEur: 99.5,
    currentValueLocal: 9000, currentValueEur: 99.5,
    prevValueEur: null, prevValueLocal: null,
    pnl: -11, pnlLocal: -1000, pnlPct: -10,
    currency: 'INR', broker: 'cams',
  },
];

beforeEach(() => {
  vi.mocked(computeHoldings).mockResolvedValue(TWO_INR_HOLDINGS as any);
  vi.mocked(recordSnapshot).mockClear();
});

describe('GET /api/portfolio', () => {
  it('groups summary by currency — no EUR conversion', async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.summary.byCurrency).toHaveLength(1);
    expect(data.summary.byCurrency[0].currency).toBe('INR');
    expect(data.summary.byCurrency[0].totalValue).toBe(24000);
    expect(data.summary.byCurrency[0].totalPnl).toBe(1000);
  });

  it('totalPnlPct is based on local cost', async () => {
    const res = await GET();
    const data = await res.json();

    // cost = 100×130 + 50×200 = 13000 + 10000 = 23000; pnl = 1000; pct = 1000/23000
    expect(data.summary.byCurrency[0].totalPnlPct).toBeCloseTo(4.35);
  });

  it('summary has holdingsCount and transactionCount', async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.summary.holdingsCount).toBe(2);
    expect(data.summary.transactionCount).toBe(2);
  });

  it('summary has no EUR aggregate fields', async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.summary).not.toHaveProperty('totalValueEur');
    expect(data.summary).not.toHaveProperty('totalPnl');
    expect(data.summary).not.toHaveProperty('delta30d');
    expect(data.summary).not.toHaveProperty('delta7d');
  });

  it('calls recordSnapshot with per-currency local values', async () => {
    await GET();
    expect(recordSnapshot).toHaveBeenCalledWith({ INR: 24000 });
  });

  it('brokerAllocation uses local values', async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.brokerAllocation.cams).toBe(24000);
  });
});
