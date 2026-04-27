import Database from 'better-sqlite3';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Real in-memory SQLite — no SQL mocking, actual queries get tested
// ---------------------------------------------------------------------------
let testDb: Database.Database;

vi.mock('@/domains/shared/db', () => ({
  getDb: () => testDb,
}));

import { recordSnapshot, getSnapshotDelta, getAllSnapshots } from './snapshots';

beforeEach(() => {
  testDb = new Database(':memory:');
  testDb.exec(`
    CREATE TABLE snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      total_value_eur REAL,
      created_at TEXT
    )
  `);
});

// ---------------------------------------------------------------------------
// recordSnapshot
// ---------------------------------------------------------------------------
describe('recordSnapshot', () => {

  it('inserts a row for today', () => {
    recordSnapshot(47234.50);

    const rows = testDb.prepare('SELECT * FROM snapshots').all() as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].total_value_eur).toBe(47234.50);
    expect(rows[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('calling twice on the same day only stores one row (INSERT OR IGNORE)', () => {
    recordSnapshot(47234.50);
    recordSnapshot(49000.00); // second call — same day, should be ignored

    const rows = testDb.prepare('SELECT * FROM snapshots').all() as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].total_value_eur).toBe(47234.50); // first value preserved
  });

});

// ---------------------------------------------------------------------------
// getSnapshotDelta
// ---------------------------------------------------------------------------
describe('getSnapshotDelta', () => {

  it('returns null when no snapshot exists for that period', () => {
    // No rows at all
    expect(getSnapshotDelta(30)).toBeNull();
  });

  it('returns null when only recent snapshots exist (none old enough)', () => {
    // Insert a snapshot from 5 days ago — not old enough for a 30d delta
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-04-20', 44000, new Date().toISOString());

    expect(getSnapshotDelta(30)).toBeNull();
  });

  it('returns the portfolio value from 30 days ago when snapshot exists', () => {
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-03-25', 42000, new Date().toISOString()); // 31 days ago

    expect(getSnapshotDelta(30)).toBe(42000);
  });

  it('returns the closest snapshot not newer than N days', () => {
    // Two old snapshots — should return the more recent one (closest to 30d)
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-03-01', 38000, new Date().toISOString()); // ~55 days ago
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-03-25', 42000, new Date().toISOString()); // 31 days ago

    expect(getSnapshotDelta(30)).toBe(42000); // returns the closer one
  });

  it('works for 7-day delta', () => {
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-04-17', 45000, new Date().toISOString()); // 8 days ago

    expect(getSnapshotDelta(7)).toBe(45000);
  });

});

// ---------------------------------------------------------------------------
// getAllSnapshots
// ---------------------------------------------------------------------------
describe('getAllSnapshots', () => {

  it('returns empty array when no snapshots exist', () => {
    expect(getAllSnapshots()).toEqual([]);
  });

  it('returns all snapshots ordered by date ascending', () => {
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-04-20', 44000, new Date().toISOString());
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-04-10', 41000, new Date().toISOString());
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-04-25', 47234, new Date().toISOString());

    const snapshots = getAllSnapshots();

    expect(snapshots).toHaveLength(3);
    expect(snapshots[0].date).toBe('2026-04-10');
    expect(snapshots[1].date).toBe('2026-04-20');
    expect(snapshots[2].date).toBe('2026-04-25');
  });

  it('returns only date and total_value_eur fields', () => {
    testDb.prepare('INSERT INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)')
      .run('2026-04-25', 47234, new Date().toISOString());

    const [snap] = getAllSnapshots();
    expect(snap).toHaveProperty('date');
    expect(snap).toHaveProperty('total_value_eur');
    expect(snap).not.toHaveProperty('id');
    expect(snap).not.toHaveProperty('created_at');
  });

});
