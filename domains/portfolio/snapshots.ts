import { getDb } from '@/domains/shared/db';

export const recordSnapshot = (byCurrency: Record<string, number>): void => {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO snapshots (date, currency, total_value, created_at) VALUES (?, ?, ?, ?)'
  );
  for (const [currency, value] of Object.entries(byCurrency)) {
    stmt.run(today, currency, value, new Date().toISOString());
  }
};

export const getAllSnapshots = (currency: string): { date: string; total_value: number }[] => {
  const db = getDb();
  return db.prepare(
    'SELECT date, total_value FROM snapshots WHERE currency = ? ORDER BY date ASC'
  ).all(currency) as { date: string; total_value: number }[];
};
