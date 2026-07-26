import { vi, describe, it, expect, beforeEach } from 'vitest';

const historyMocks = vi.hoisted(() => ({
  upsertPriceHistory: vi.fn(),
  getLatestHistoryDate: vi.fn(),
}));
const fetcherMocks = vi.hoisted(() => ({
  fetchYahooPriceHistory: vi.fn(),
  fetchMfNavHistory: vi.fn(),
  fetchCryptoPriceHistory: vi.fn(),
}));

vi.mock('./history', () => ({
  upsertPriceHistory: historyMocks.upsertPriceHistory,
  getLatestHistoryDate: historyMocks.getLatestHistoryDate,
}));
vi.mock('./fetchers/yahoo', () => ({ fetchYahooPriceHistory: fetcherMocks.fetchYahooPriceHistory }));
vi.mock('./fetchers/amfi', () => ({ fetchMfNavHistory: fetcherMocks.fetchMfNavHistory }));
vi.mock('./fetchers/crypto', () => ({ fetchCryptoPriceHistory: fetcherMocks.fetchCryptoPriceHistory }));

import { backfillPriceHistory } from './backfill';

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  historyMocks.upsertPriceHistory.mockReset();
  historyMocks.getLatestHistoryDate.mockReset().mockReturnValue(null);
  fetcherMocks.fetchYahooPriceHistory.mockReset().mockResolvedValue(null);
  fetcherMocks.fetchMfNavHistory.mockReset().mockResolvedValue(null);
  fetcherMocks.fetchCryptoPriceHistory.mockReset().mockResolvedValue(null);
});

describe('backfillPriceHistory', () => {
  it('routes mutual funds to AMFI and stores rows under the canonical ticker', async () => {
    fetcherMocks.fetchMfNavHistory.mockResolvedValue([
      { date: '2026-07-24', price: 151, currency: 'INR' },
    ]);

    const result = await backfillPriceHistory(
      [{ ticker: 'INF109K01Z48', assetType: 'mf', currency: 'INR', fromDate: '2026-01-01' }],
      { cryptoDelayMs: 0 }
    );

    expect(fetcherMocks.fetchMfNavHistory).toHaveBeenCalledWith('INF109K01Z48', '2026-01-01');
    expect(historyMocks.upsertPriceHistory).toHaveBeenCalledWith([
      { ticker: 'INF109K01Z48', date: '2026-07-24', priceLocal: 151, currency: 'INR' },
    ]);
    expect(result).toEqual({ updated: 1, failed: [] });
  });

  it('suffixes INR stocks with .NS for Yahoo but stores under the original ticker', async () => {
    fetcherMocks.fetchYahooPriceHistory.mockResolvedValue([
      { date: '2026-07-24', price: 2890, currency: 'INR' },
    ]);

    await backfillPriceHistory(
      [{ ticker: 'RELIANCE', assetType: 'stock', currency: 'INR', fromDate: '2026-01-01' }],
      { cryptoDelayMs: 0 }
    );

    expect(fetcherMocks.fetchYahooPriceHistory).toHaveBeenCalledWith('RELIANCE.NS', '2026-01-01');
    expect(historyMocks.upsertPriceHistory.mock.calls[0][0][0].ticker).toBe('RELIANCE');
  });

  it('tops up incrementally from the day after the last stored date', async () => {
    historyMocks.getLatestHistoryDate.mockReturnValue('2026-07-20');
    fetcherMocks.fetchYahooPriceHistory.mockResolvedValue([
      { date: '2026-07-21', price: 100, currency: 'EUR' },
    ]);

    await backfillPriceHistory(
      [{ ticker: 'IWDA.AS', assetType: 'etf', currency: 'EUR', fromDate: '2026-01-01' }],
      { cryptoDelayMs: 0 }
    );

    expect(fetcherMocks.fetchYahooPriceHistory).toHaveBeenCalledWith('IWDA.AS', '2026-07-21');
  });

  it('skips fetching when history is already current through today', async () => {
    historyMocks.getLatestHistoryDate.mockReturnValue(today);

    const result = await backfillPriceHistory(
      [{ ticker: 'IWDA.AS', assetType: 'etf', currency: 'EUR', fromDate: '2026-01-01' }],
      { cryptoDelayMs: 0 }
    );

    expect(fetcherMocks.fetchYahooPriceHistory).not.toHaveBeenCalled();
    expect(result).toEqual({ updated: 1, failed: [] });
  });

  it('routes crypto to CoinGecko and reports fetch failures', async () => {
    fetcherMocks.fetchCryptoPriceHistory.mockResolvedValue(null);

    const result = await backfillPriceHistory(
      [{ ticker: 'BTC', assetType: 'crypto', currency: 'EUR', fromDate: '2026-01-01' }],
      { cryptoDelayMs: 0 }
    );

    expect(fetcherMocks.fetchCryptoPriceHistory).toHaveBeenCalledWith('BTC', '2026-01-01');
    expect(result).toEqual({ updated: 0, failed: ['BTC'] });
  });

  it('reports progress per ticker', async () => {
    fetcherMocks.fetchYahooPriceHistory.mockResolvedValue([
      { date: '2026-07-24', price: 100, currency: 'EUR' },
    ]);
    const progressUpdates: Array<{ current: number; total: number }> = [];

    await backfillPriceHistory(
      [
        { ticker: 'IWDA.AS', assetType: 'etf', currency: 'EUR', fromDate: '2026-01-01' },
        { ticker: 'AAPL', assetType: 'stock', currency: 'USD', fromDate: '2026-01-01' },
      ],
      { cryptoDelayMs: 0, onProgress: (current, total) => progressUpdates.push({ current, total }) }
    );

    expect(progressUpdates).toEqual([
      { current: 1, total: 2 },
      { current: 2, total: 2 },
    ]);
  });
});
