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
    ticker: 'HDFC', name: 'HDFC MF', asset_type: 'mf',
    quantity: 100, avg_cost_local: 130, avg_cost_eur: 1.44,
    current_price_local: 150, current_price_eur: 1.65,
    current_value_local: 15000, current_value_eur: 165,
    prev_value_eur: null, prev_value_local: null,
    pnl: 21, pnl_local: 2000, pnl_pct: 15.38,
    currency: 'INR', broker: 'cams',
  },
  {
    ticker: 'SBI', name: 'SBI MF', asset_type: 'mf',
    quantity: 50, avg_cost_local: 200, avg_cost_eur: 2.21,
    current_price_local: 9000, current_price_eur: 99.5,
    current_value_local: 9000, current_value_eur: 99.5,
    prev_value_eur: null, prev_value_local: null,
    pnl: -11, pnl_local: -1000, pnl_pct: -10,
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

    expect(data.summary.by_currency).toHaveLength(1);
    expect(data.summary.by_currency[0].currency).toBe('INR');
    expect(data.summary.by_currency[0].total_value).toBe(24000);
    expect(data.summary.by_currency[0].total_pnl).toBe(1000);
  });

  it('total_pnl_pct is based on local cost', async () => {
    const res = await GET();
    const data = await res.json();

    // cost = 100×130 + 50×200 = 13000 + 10000 = 23000; pnl = 1000; pct = 1000/23000
    expect(data.summary.by_currency[0].total_pnl_pct).toBeCloseTo(4.35);
  });

  it('summary has holdings_count and transaction_count', async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.summary.holdings_count).toBe(2);
    expect(data.summary.transaction_count).toBe(2);
  });

  it('summary has no EUR aggregate fields', async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.summary).not.toHaveProperty('total_value_eur');
    expect(data.summary).not.toHaveProperty('total_pnl');
    expect(data.summary).not.toHaveProperty('delta_30d');
    expect(data.summary).not.toHaveProperty('delta_7d');
  });

  it('calls recordSnapshot with per-currency local values', async () => {
    await GET();
    expect(recordSnapshot).toHaveBeenCalledWith({ INR: 24000 });
  });

  it('broker_allocation uses local values', async () => {
    const res = await GET();
    const data = await res.json();

    expect(data.broker_allocation.cams).toBe(24000);
  });
});
