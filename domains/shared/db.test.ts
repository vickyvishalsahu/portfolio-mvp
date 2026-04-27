import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach } from 'vitest';
import { initializeDb } from './db';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
});

describe('price_cache schema', () => {
  it('creates price_cache with prev_price_local column', () => {
    initializeDb(db);
    const cols = (db.prepare('PRAGMA table_info(price_cache)').all() as { name: string }[]).map(c => c.name);
    expect(cols).toContain('prev_price_local');
  });

  it('migrates existing price_cache missing prev_price_local', () => {
    db.exec(`CREATE TABLE price_cache (
      ticker TEXT PRIMARY KEY, price_eur REAL, prev_price_eur REAL,
      price_local REAL, currency TEXT, updated_at TEXT
    )`);
    initializeDb(db);
    const cols = (db.prepare('PRAGMA table_info(price_cache)').all() as { name: string }[]).map(c => c.name);
    expect(cols).toContain('prev_price_local');
  });
});

describe('snapshots schema', () => {
  it('creates snapshots with (date, currency, total_value) — no total_value_eur', () => {
    initializeDb(db);
    const cols = (db.prepare('PRAGMA table_info(snapshots)').all() as { name: string }[]).map(c => c.name);
    expect(cols).toContain('currency');
    expect(cols).toContain('total_value');
    expect(cols).not.toContain('total_value_eur');
  });

  it('enforces UNIQUE(date, currency) — same day same currency rejected', () => {
    initializeDb(db);
    db.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-27', 'INR', 1650000, new Date().toISOString());
    expect(() => {
      db.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-27', 'INR', 1700000, new Date().toISOString());
    }).toThrow();
  });

  it('allows same date with different currencies', () => {
    initializeDb(db);
    db.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-27', 'INR', 1650000, new Date().toISOString());
    expect(() => {
      db.prepare('INSERT INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)').run('2026-04-27', 'EUR', 2400, new Date().toISOString());
    }).not.toThrow();
  });

  it('migrates old snapshots table with total_value_eur — drops stale data', () => {
    db.exec(`CREATE TABLE snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE, total_value_eur REAL, created_at TEXT
    )`);
    db.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)').run('2026-04-01', 17918.76, new Date().toISOString());

    initializeDb(db);

    const cols = (db.prepare('PRAGMA table_info(snapshots)').all() as { name: string }[]).map(c => c.name);
    expect(cols).not.toContain('total_value_eur');
    expect(cols).toContain('currency');
    expect(cols).toContain('total_value');
    const count = db.prepare('SELECT COUNT(*) as n FROM snapshots').get() as { n: number };
    expect(count.n).toBe(0);
  });
});
