import type { BrokerDefinition } from './types';

export const BROKER_CATALOG: BrokerDefinition[] = [];

export const GET_SETTING = 'SELECT value FROM settings WHERE key = ?';
export const DELETE_SETTING = 'DELETE FROM settings WHERE key = ?';
export const UPSERT_SETTING = 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)';
export const INSERT_TRANSACTION = `
  INSERT INTO transactions (email_id, asset_type, ticker, name, quantity, price, currency, transaction_type, transaction_date, broker, raw_text, confidence)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
export const GET_ALL_TRANSACTIONS = 'SELECT * FROM transactions ORDER BY transaction_date DESC';
export const GET_PRICE_CACHE_AGE = 'SELECT MAX(updated_at) as latest FROM price_cache';
