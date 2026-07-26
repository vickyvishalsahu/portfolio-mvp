import { getDb } from '@/domains/shared/db';
import { UPSERT_PRICE_HISTORY, GET_PRICE_HISTORY, GET_LATEST_HISTORY_DATE } from './constants';

export type PriceHistoryRow = {
  ticker: string;
  date: string;
  priceLocal: number;
  currency: string;
};

export const upsertPriceHistory = (rows: PriceHistoryRow[]): void => {
  const db = getDb();
  const statement = db.prepare(UPSERT_PRICE_HISTORY);
  const insertAll = db.transaction((historyRows: PriceHistoryRow[]) => {
    for (const row of historyRows) {
      statement.run(row.ticker, row.date, row.priceLocal, row.currency);
    }
  });
  insertAll(rows);
};

export const getPriceHistory = (ticker: string): PriceHistoryRow[] => {
  const db = getDb();
  const rows = db.prepare(GET_PRICE_HISTORY).all(ticker) as Array<{
    ticker: string; date: string; price_local: number; currency: string;
  }>;
  return rows.map((row) => ({
    ticker: row.ticker,
    date: row.date,
    priceLocal: row.price_local,
    currency: row.currency,
  }));
};

export const getLatestHistoryDate = (ticker: string): string | null => {
  const db = getDb();
  const row = db.prepare(GET_LATEST_HISTORY_DATE).get(ticker) as { latest_date: string | null } | undefined;
  return row?.latest_date ?? null;
};
