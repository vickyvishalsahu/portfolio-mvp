import Database from 'better-sqlite3';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let testDb: Database.Database;

vi.mock('@/domains/shared/db', () => ({ getDb: () => testDb }));

import { recordSnapshot, getAllSnapshots } from './snapshots';

beforeEach(() => {
  testDb = new Database(':memory:');
  testDb.exec(`
    CREATE TABLE snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      currency TEXT NOT NULL,
      total_value REAL NOT NULL,
      created_at TEXT,
      UNIQUE(date, currency)
    )
  `);
});

describe('recordSnapshot', () => {
  it('inserts one row per currency', () => {
    recordSnapshot({ INR: 1650000, EUR: 2400 });

    const rows = testDb.prepare('SELECT * FROM snapshots ORDER BY currency ASC').all() as any[];
    expect(rows).toHaveLength(2);
    expect(rows[0].currency).toBe('EUR');
    expect(rows[0].total_value).toBe(2400);
    expect(rows[1].currency).toBe('INR');
    expect(rows[1].total_value).toBe(1650000);
  });

  it('calling twice on the same day is idempotent (INSERT OR IGNORE)', () => {
    recordSnapshot({ INR: 1650000 });
    recordSnapshot({ INR: 1700000 });

    const rows = testDb.prepare('SELECT * FROM snapshots').all() as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].total_value).toBe(1650000); // first value preserved
  });

  it('stores date in YYYY-MM-DD format', () => {
    recordSnapshot({ INR: 1650000 });

    const row = testDb.prepare('SELECT date FROM snapshots').get() as any;
    expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('empty input inserts nothing', () => {
    recordSnapshot({});

    const count = testDb.prepare('SELECT COUNT(*) as n FROM snapshots').get() as { n: number };
    expect(count.n).toBe(0);
  });
});

describe('getAllSnapshots', () => {
  it('returns empty array when no snapshots exist', () => {
    expect(getAllSnapshots('INR')).toEqual([]);
  });

  it('returns only rows for the requested currency, ascending by date', () => {
    testDb.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-20', 'INR', 1600000, new Date().toISOString());
    testDb.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-10', 'INR', 1550000, new Date().toISOString());
    testDb.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-20', 'EUR', 2400, new Date().toISOString());

    const inr = getAllSnapshots('INR');
    expect(inr).toHaveLength(2);
    expect(inr[0].date).toBe('2026-04-10');
    expect(inr[1].date).toBe('2026-04-20');
    expect(inr[0]).not.toHaveProperty('currency'); // only date + totalValue returned
  });

  it('returns only date and total_value fields', () => {
    testDb.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-27', 'INR', 1650000, new Date().toISOString());

    const [snap] = getAllSnapshots('INR');
    expect(snap).toHaveProperty('date');
    expect(snap).toHaveProperty('totalValue');
    expect(snap).not.toHaveProperty('id');
    expect(snap).not.toHaveProperty('created_at');
    expect(snap).not.toHaveProperty('currency');
  });

  it('EUR query returns only EUR rows', () => {
    testDb.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-27', 'INR', 1650000, new Date().toISOString());
    testDb.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-27', 'EUR', 2400, new Date().toISOString());

    const eur = getAllSnapshots('EUR');
    expect(eur).toHaveLength(1);
    expect(eur[0].totalValue).toBe(2400);
  });
});
