import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fetchCryptoPriceHistory } from './crypto';

describe('fetchCryptoPriceHistory', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps CoinGecko [timestamp, price] pairs to daily EUR rows, keeping the last price per day', async () => {
    const morning = Date.UTC(2026, 6, 25, 9, 0, 0);
    const evening = Date.UTC(2026, 6, 25, 21, 0, 0);
    const nextDay = Date.UTC(2026, 6, 26, 9, 0, 0);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ prices: [[morning, 60000], [evening, 61000], [nextDay, 62000]] }),
    }));

    const history = await fetchCryptoPriceHistory('BTC', '2026-07-01');

    expect(history).toEqual([
      { date: '2026-07-25', price: 61000, currency: 'EUR' },
      { date: '2026-07-26', price: 62000, currency: 'EUR' },
    ]);
  });

  it('caps the requested range at 365 days for the free CoinGecko tier', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ prices: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    await fetchCryptoPriceHistory('BTC', '2020-01-01');

    expect(fetchMock.mock.calls[0][0]).toContain('days=365');
  });

  it('returns null for an unknown ticker without fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await fetchCryptoPriceHistory('NOTACOIN', '2026-01-01')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null when the fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rate limited')));

    expect(await fetchCryptoPriceHistory('BTC', '2026-01-01')).toBeNull();
  });
});
