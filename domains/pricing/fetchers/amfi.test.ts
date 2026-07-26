import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchMfNavHistory } from './amfi';

const stubAmfiResponses = (searchResults: unknown, historyPayload: unknown) => {
  let callCount = 0;
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) return Promise.resolve({ json: () => Promise.resolve(searchResults) });
    return Promise.resolve({ json: () => Promise.resolve(historyPayload) });
  }));
};

describe('fetchMfNavHistory', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('converts AMFI DD-MM-YYYY dates to ISO and returns rows ascending', async () => {
    stubAmfiResponses([{ schemeCode: '119551' }], {
      data: [
        { date: '25-07-2026', nav: '152.50' },
        { date: '24-07-2026', nav: '151.00' },
      ],
    });

    const history = await fetchMfNavHistory('INF109K01Z48', '2026-01-01');

    expect(history).toEqual([
      { date: '2026-07-24', price: 151.0, currency: 'INR' },
      { date: '2026-07-25', price: 152.5, currency: 'INR' },
    ]);
  });

  it('filters out NAVs older than fromDate', async () => {
    stubAmfiResponses([{ schemeCode: '119551' }], {
      data: [
        { date: '25-07-2026', nav: '152.50' },
        { date: '31-12-2025', nav: '140.00' },
      ],
    });

    const history = await fetchMfNavHistory('INF109K01Z48', '2026-01-01');

    expect(history).toHaveLength(1);
    expect(history![0].date).toBe('2026-07-25');
  });

  it('returns null when the scheme is not found', async () => {
    stubAmfiResponses([], {});

    expect(await fetchMfNavHistory('UNKNOWN', '2026-01-01')).toBeNull();
  });

  it('returns null when the fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    expect(await fetchMfNavHistory('INF109K01Z48', '2026-01-01')).toBeNull();
  });
});
