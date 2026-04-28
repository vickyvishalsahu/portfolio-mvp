import { getDb } from '@/domains/shared/db';
import type { PriceCache } from '@/domains/shared/types';
import { CACHE_TTL, GET_CACHED_PRICE, GET_EXISTING_PRICE, GET_PREV_PRICE, UPSERT_PRICE } from './constants';

export const getCachedPrice = (ticker: string): PriceCache | null => {
  const db = getDb();
  const row = db.prepare(GET_CACHED_PRICE).get(ticker) as PriceCache | undefined;
  if (!row) return null;

  const age = Date.now() - new Date(row.updated_at).getTime();
  if (age > CACHE_TTL) return null;

  return row;
};

export const setCachedPrice = (ticker: string, priceEur: number, priceLocal: number, currency: string): void => {
  const db = getDb();
  const existing = db.prepare(GET_EXISTING_PRICE).get(ticker) as { price_eur: number; price_local: number } | undefined;
  db.prepare(UPSERT_PRICE).run(ticker, priceEur, existing?.price_eur ?? null, priceLocal, existing?.price_local ?? null, currency, new Date().toISOString());
};

export const getPrevPrice = (ticker: string): { prev_price_eur: number | null; prev_price_local: number | null } | null => {
  const db = getDb();
  const row = db.prepare(GET_PREV_PRICE).get(ticker) as { prev_price_eur: number | null; prev_price_local: number | null } | undefined;
  return row ?? null;
};
