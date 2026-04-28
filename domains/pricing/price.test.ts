import Database from 'better-sqlite3';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let testDb: Database.Database;

vi.mock('@/domains/shared/db', () => ({ getDb: () => testDb }));
vi.mock('./currency', () => ({ convertToEur: vi.fn((amount: number) => Promise.resolve(amount)) }));
vi.mock('yahoo-finance2', () => ({ default: class { quote = vi.fn() } }));

import { getPrice } from './price';

beforeEach(() => {
  testDb = new Database(':memory:');
  testDb.exec(`
    CREATE TABLE price_cache (
      ticker TEXT PRIMARY KEY,
      price_eur REAL,
      prev_price_eur REAL,
      price_local REAL,
      prev_price_local REAL,
      currency TEXT,
      updated_at TEXT
    )
  `);
});

describe('setCachedPrice — prev_price_local preservation', () => {
  it('first write: prev_price_local is null', async () => {
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ json: () => Promise.resolve([{ schemeCode: '123' }]) });
      return Promise.resolve({ json: () => Promise.resolve({ data: [{ nav: '150.00' }] }) });
    }));

    await getPrice('HDFC_MF', 'mf', 'INR');

    const row = testDb.prepare('SELECT * FROM price_cache WHERE ticker = ?').get('HDFC_MF') as any;
    expect(row.price_local).toBe(150);
    expect(row.prev_price_local).toBeNull();
  });

  it('second write: prev_price_local = first write price_local', async () => {
    testDb.prepare(
      'INSERT INTO price_cache (ticker, price_eur, prev_price_eur, price_local, prev_price_local, currency, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('HDFC_MF', 1.65, null, 150, null, 'INR', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ json: () => Promise.resolve([{ schemeCode: '123' }]) });
      return Promise.resolve({ json: () => Promise.resolve({ data: [{ nav: '155.00' }] }) });
    }));

    await getPrice('HDFC_MF', 'mf', 'INR');

    const row = testDb.prepare('SELECT * FROM price_cache WHERE ticker = ?').get('HDFC_MF') as any;
    expect(row.price_local).toBe(155);
    expect(row.prev_price_local).toBe(150);
  });
});
