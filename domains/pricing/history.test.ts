import Database from 'better-sqlite3';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let testDb: Database.Database;

vi.mock('@/domains/shared/db', () => ({ getDb: () => testDb }));

import { upsertPriceHistory, getPriceHistory, getLatestHistoryDate } from './history';

beforeEach(() => {
  testDb = new Database(':memory:');
  testDb.exec(`
    CREATE TABLE price_history (
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      price_local REAL NOT NULL,
      currency TEXT NOT NULL,
      PRIMARY KEY (ticker, date)
    )
  `);
});

describe('upsertPriceHistory', () => {
  it('inserts rows and getPriceHistory returns them ascending by date', () => {
    upsertPriceHistory([
      { ticker: 'AAPL', date: '2026-07-25', priceLocal: 211, currency: 'USD' },
      { ticker: 'AAPL', date: '2026-07-24', priceLocal: 210, currency: 'USD' },
    ]);

    const history = getPriceHistory('AAPL');

    expect(history).toEqual([
      { ticker: 'AAPL', date: '2026-07-24', priceLocal: 210, currency: 'USD' },
      { ticker: 'AAPL', date: '2026-07-25', priceLocal: 211, currency: 'USD' },
    ]);
  });

  it('is idempotent — re-inserting the same (ticker, date) keeps the first value', () => {
    upsertPriceHistory([{ ticker: 'AAPL', date: '2026-07-25', priceLocal: 211, currency: 'USD' }]);
    upsertPriceHistory([{ ticker: 'AAPL', date: '2026-07-25', priceLocal: 999, currency: 'USD' }]);

    const history = getPriceHistory('AAPL');

    expect(history).toHaveLength(1);
    expect(history[0].priceLocal).toBe(211);
  });

  it('only returns rows for the requested ticker', () => {
    upsertPriceHistory([
      { ticker: 'AAPL', date: '2026-07-25', priceLocal: 211, currency: 'USD' },
      { ticker: 'RELIANCE', date: '2026-07-25', priceLocal: 2900, currency: 'INR' },
    ]);

    expect(getPriceHistory('RELIANCE')).toHaveLength(1);
    expect(getPriceHistory('RELIANCE')[0].currency).toBe('INR');
  });
});

describe('getLatestHistoryDate', () => {
  it('returns the most recent stored date for a ticker', () => {
    upsertPriceHistory([
      { ticker: 'AAPL', date: '2026-07-24', priceLocal: 210, currency: 'USD' },
      { ticker: 'AAPL', date: '2026-07-25', priceLocal: 211, currency: 'USD' },
    ]);

    expect(getLatestHistoryDate('AAPL')).toBe('2026-07-25');
  });

  it('returns null when no history exists', () => {
    expect(getLatestHistoryDate('UNKNOWN')).toBeNull();
  });
});
