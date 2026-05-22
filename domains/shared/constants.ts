import type { BrokerDefinition } from './types';

export const BROKER_CATALOG: BrokerDefinition[] = [];

export const KNOWN_BROKERS: { id: string; name: string; senderDomains: string[] }[] = [
  { id: 'zerodha',  name: 'Zerodha',          senderDomains: ['zerodha.com'] },
  { id: 'cams',     name: 'CAMS',             senderDomains: ['camsonline.com', 'camsmail.com'] },
  { id: 'groww',    name: 'Groww',            senderDomains: ['groww.in'] },
  { id: 'angelone', name: 'Angel One',        senderDomains: ['angelone.in', 'angelbroking.com'] },
  { id: 'scalable', name: 'Scalable Capital', senderDomains: ['scalable.capital'] },
  { id: 'binance',  name: 'Binance',          senderDomains: ['binance.com', 'mail.binance.com'] },
  { id: 'coinbase', name: 'Coinbase',         senderDomains: ['coinbase.com', 'mail.coinbase.com'] },
];

export const GET_SETTING = 'SELECT value FROM settings WHERE key = ?';
export const DELETE_SETTING = 'DELETE FROM settings WHERE key = ?';
export const UPSERT_SETTING = 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)';
export const INSERT_TRANSACTION = `
  INSERT INTO transactions (email_id, asset_type, ticker, name, quantity, price, currency, transaction_type, transaction_date, broker, raw_text, confidence)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
export const GET_ALL_TRANSACTIONS = 'SELECT * FROM transactions ORDER BY transaction_date DESC';
export const GET_MANUAL_TRANSACTIONS = "SELECT * FROM transactions WHERE email_id = 'manual' ORDER BY transaction_date DESC";
export const DELETE_MANUAL_TRANSACTION = "DELETE FROM transactions WHERE id = ? AND email_id = 'manual'";
export const GET_PRICE_CACHE_AGE = 'SELECT MAX(updated_at) as latest FROM price_cache';
export const GET_EARLIEST_BUY_DATES = `
  SELECT COALESCE(ticker, name) AS key, MIN(transaction_date) AS earliest_date
  FROM transactions
  WHERE transaction_type IN ('buy', 'sip')
  GROUP BY COALESCE(ticker, name)
`;
