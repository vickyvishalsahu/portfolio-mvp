import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Transaction } from '@/domains/shared/types';
import type { PriceHistoryRow } from '@/domains/pricing';

// ---------------------------------------------------------------------------
// Mocks — hoisted before imports (only exercised by the getPortfolioHistory tests)
// ---------------------------------------------------------------------------

let mockTransactions: Transaction[] = [];
let mockPriceHistoryByTicker: Record<string, PriceHistoryRow[]> = {};
let mockSnapshots: { date: string; totalValue: number }[] = [];

vi.mock('@/domains/shared/db', () => ({
  getAllTransactions: () => mockTransactions,
}));

vi.mock('@/domains/pricing', () => ({
  getPriceHistory: (ticker: string) => mockPriceHistoryByTicker[ticker] ?? [],
}));

vi.mock('./snapshots', () => ({
  getAllSnapshots: () => mockSnapshots,
}));

import { computePortfolioHistory, getPortfolioHistory } from './history';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 1,
  emailId: 'test',
  assetType: 'stock',
  ticker: 'AAPL',
  name: 'Apple Inc',
  quantity: 10,
  price: 100,
  currency: 'EUR',
  transactionType: 'buy',
  transactionDate: '2026-01-01',
  broker: 'scalable',
  rawText: '',
  confidence: 'high',
  ...overrides,
});

const priceRow = (date: string, priceLocal: number, currency = 'EUR'): PriceHistoryRow => ({
  ticker: 'AAPL',
  date,
  priceLocal,
  currency,
});

describe('computePortfolioHistory', () => {
  it('returns an empty object for no transactions', () => {
    expect(computePortfolioHistory([], {})).toEqual({});
  });

  it('carries the last known price forward across a gap in price history', () => {
    const transactions = [makeTransaction({ quantity: 10, price: 100, transactionDate: '2026-01-01' })];
    const priceHistory = { AAPL: [priceRow('2026-01-01', 100), priceRow('2026-01-03', 110)] };

    const history = computePortfolioHistory(transactions, priceHistory, '2026-01-03');

    expect(history.EUR).toEqual([
      { date: '2026-01-01', totalValue: 1000 },
      { date: '2026-01-02', totalValue: 1000 },
      { date: '2026-01-03', totalValue: 1100 },
    ]);
  });

  it('seeds the price from the transaction itself before any price history exists for that key', () => {
    const transactions = [makeTransaction({ quantity: 2, price: 50, transactionDate: '2026-01-01' })];
    const priceHistory = { AAPL: [priceRow('2026-01-05', 60)] };

    const history = computePortfolioHistory(transactions, priceHistory, '2026-01-05');

    expect(history.EUR).toEqual([
      { date: '2026-01-01', totalValue: 100 },
      { date: '2026-01-02', totalValue: 100 },
      { date: '2026-01-03', totalValue: 100 },
      { date: '2026-01-04', totalValue: 100 },
      { date: '2026-01-05', totalValue: 120 },
    ]);
  });

  it('never blends currencies — each currency gets its own series', () => {
    const transactions = [
      makeTransaction({ ticker: 'AAPL', currency: 'EUR', quantity: 10, price: 100, transactionDate: '2026-01-01' }),
      makeTransaction({ ticker: 'RELIANCE', currency: 'INR', quantity: 5, price: 2000, transactionDate: '2026-01-01' }),
    ];

    const history = computePortfolioHistory(transactions, {}, '2026-01-01');

    expect(history.EUR).toEqual([{ date: '2026-01-01', totalValue: 1000 }]);
    expect(history.INR).toEqual([{ date: '2026-01-01', totalValue: 10000 }]);
  });

  it('clamps an oversell to zero instead of going negative', () => {
    const transactions = [
      makeTransaction({ quantity: 5, price: 100, transactionType: 'buy', transactionDate: '2026-01-01' }),
      makeTransaction({ quantity: 10, price: 100, transactionType: 'sell', transactionDate: '2026-01-02' }),
    ];

    const history = computePortfolioHistory(transactions, {}, '2026-01-02');

    expect(history.EUR).toEqual([
      { date: '2026-01-01', totalValue: 500 },
      { date: '2026-01-02', totalValue: 0 },
    ]);
  });

  it('drops a fully sold holding from the total from the day it is sold', () => {
    const transactions = [
      makeTransaction({ quantity: 10, price: 100, transactionType: 'buy', transactionDate: '2026-01-01' }),
      makeTransaction({ quantity: 10, price: 110, transactionType: 'sell', transactionDate: '2026-01-03' }),
    ];

    const history = computePortfolioHistory(transactions, {}, '2026-01-03');

    expect(history.EUR.map((point) => point.totalValue)).toEqual([1000, 1000, 0]);
  });

  it('ignores dividends — they never change the held quantity', () => {
    const transactions = [
      makeTransaction({ quantity: 10, price: 100, transactionType: 'buy', transactionDate: '2026-01-01' }),
      makeTransaction({ quantity: 999, price: 5, transactionType: 'dividend', transactionDate: '2026-01-02' }),
    ];

    const history = computePortfolioHistory(transactions, {}, '2026-01-02');

    expect(history.EUR).toEqual([
      { date: '2026-01-01', totalValue: 1000 },
      { date: '2026-01-02', totalValue: 1000 },
    ]);
  });
});

describe('getPortfolioHistory', () => {
  beforeEach(() => {
    mockTransactions = [];
    mockPriceHistoryByTicker = {};
    mockSnapshots = [{ date: '2026-01-01', totalValue: 42 }];
  });

  it('falls back to snapshots when there are no transactions', () => {
    expect(getPortfolioHistory('EUR')).toEqual(mockSnapshots);
  });

  it('falls back to snapshots when transactions exist but no price history has been backfilled', () => {
    mockTransactions = [makeTransaction()];

    expect(getPortfolioHistory('EUR')).toEqual(mockSnapshots);
  });

  it('returns the reconstructed series once price history exists', () => {
    mockTransactions = [makeTransaction({ quantity: 10, price: 100, transactionDate: '2026-01-01' })];
    mockPriceHistoryByTicker = { AAPL: [priceRow('2026-01-01', 120)] };

    const history = getPortfolioHistory('EUR');

    expect(history[0]).toEqual({ date: '2026-01-01', totalValue: 1200 });
    expect(history.length).toBeGreaterThan(1);
  });
});
