import { describe, it, expect } from 'vitest';
import { buildCsv } from './export';
import type { Transaction } from '@/domains/shared/types';

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    emailId: 'test',
    assetType: 'stock',
    ticker: 'AAPL',
    name: 'Apple Inc',
    quantity: 10,
    price: 150.50,
    currency: 'EUR',
    transactionType: 'buy',
    transactionDate: '2026-04-01',
    broker: 'scalable',
    rawText: '',
    confidence: 'high',
    ...overrides,
  };
}

describe('buildCsv', () => {

  it('first line is the header row', () => {
    const csv = buildCsv([]);
    const header = csv.split('\n')[0];
    expect(header).toBe('date,broker,ticker,name,asset_type,transaction_type,quantity,price,currency');
  });

  it('empty transactions returns only the header', () => {
    const lines = buildCsv([]).split('\n');
    expect(lines).toHaveLength(1);
  });

  it('maps transaction fields to correct columns', () => {
    const csv = buildCsv([makeTx()]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toBe('2026-04-01,scalable,AAPL,Apple Inc,stock,buy,10,150.5,EUR');
  });

  it('null ticker becomes empty string', () => {
    const csv = buildCsv([makeTx({ ticker: null })]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('scalable,,'); // empty ticker field
  });

  it('name containing a comma is wrapped in double quotes', () => {
    const csv = buildCsv([makeTx({ name: 'Vanguard S&P 500, Acc' })]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('"Vanguard S&P 500, Acc"');
  });

  it('name containing a double quote escapes it', () => {
    const csv = buildCsv([makeTx({ name: 'iShares "Core" MSCI' })]);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('"iShares ""Core"" MSCI"');
  });

  it('multiple transactions produce multiple data rows', () => {
    const csv = buildCsv([makeTx(), makeTx({ ticker: 'TSLA', name: 'Tesla' })]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 rows
  });

});
