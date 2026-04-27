import { getDb } from '@/domains/shared/db';

export interface Snapshot {
  date: string;
  total_value_eur: number;
}

export function recordSnapshot(totalValueEur: number): void {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(
    'INSERT OR IGNORE INTO snapshots (date, total_value_eur, created_at) VALUES (?, ?, ?)'
  ).run(today, totalValueEur, new Date().toISOString());
}

export function getSnapshotDelta(days: 7 | 30): number | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT total_value_eur FROM snapshots
    WHERE date <= date('now', '-' || ? || ' days')
    ORDER BY date DESC
    LIMIT 1
  `).get(days) as { total_value_eur: number } | undefined;
  return row?.total_value_eur ?? null;
}

export function getAllSnapshots(): Snapshot[] {
  const db = getDb();
  return db.prepare(
    'SELECT date, total_value_eur FROM snapshots ORDER BY date ASC'
  ).all() as Snapshot[];
}
