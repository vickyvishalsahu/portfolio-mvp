import { describe, it, expect } from 'vitest';
import { normalizeParsedTransaction } from './normalize';
import type { ParsedTransaction } from '@/domains/shared/types';

const baseTransaction: ParsedTransaction = {
  assetType: 'mf',
  ticker: null,
  name: 'Some Fund',
  quantity: 1,
  price: 100,
  currency: 'INR',
  transactionType: 'buy',
  transactionDate: '2026-01-01',
  broker: 'cams',
  confidence: 'high',
};

describe('normalizeParsedTransaction', () => {
  it('nulls a ticker that contains prose', () => {
    const result = normalizeParsedTransaction({ ...baseTransaction, ticker: 'ISIN not provided, skipping' });
    expect(result.ticker).toBeNull();
  });

  it('keeps a valid exchange symbol', () => {
    const result = normalizeParsedTransaction({ ...baseTransaction, ticker: 'ICIPRUFLEXG' });
    expect(result.ticker).toBe('ICIPRUFLEXG');
  });

  it('keeps a valid 12-character ISIN', () => {
    const result = normalizeParsedTransaction({ ...baseTransaction, ticker: 'INF109K01Z48' });
    expect(result.ticker).toBe('INF109K01Z48');
  });

  it('keeps a suffixed exchange ticker', () => {
    const result = normalizeParsedTransaction({ ...baseTransaction, ticker: 'VWCE.DE' });
    expect(result.ticker).toBe('VWCE.DE');
  });

  it('collapses repeated whitespace in the name', () => {
    const result = normalizeParsedTransaction({
      ...baseTransaction,
      name: 'HDFC Large Cap Fund -  Regular Plan - Growth',
    });
    expect(result.name).toBe('HDFC Large Cap Fund - Regular Plan - Growth');
  });

  it('leaves a null ticker as null', () => {
    const result = normalizeParsedTransaction({ ...baseTransaction, ticker: null });
    expect(result.ticker).toBeNull();
  });
});
