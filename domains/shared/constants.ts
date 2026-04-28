import type { BrokerDefinition } from './types';

export const BROKER_CATALOG: BrokerDefinition[] = [
  {
    id: 'scalable',
    name: 'Scalable Capital',
    senderDomains: ['scalable.capital'],
    assetTypes: ['stock', 'etf', 'crypto'],
    region: 'EU',
  },
  {
    id: 'zerodha',
    name: 'Zerodha',
    senderDomains: ['zerodha.com', 'kite.zerodha.com', 'zerodha.net'],
    gmailSearchTerms: ['zerodha.com', 'zerodha.net'],
    assetTypes: ['stock', 'etf', 'mf'],
    region: 'IN',
  },
  {
    id: 'cams',
    name: 'CAMS',
    senderDomains: ['camsonline.com', 'cams.in'],
    assetTypes: ['mf'],
    region: 'IN',
  },
  {
    id: 'groww',
    name: 'Groww',
    senderDomains: ['groww.in'],
    assetTypes: ['stock', 'mf', 'etf'],
    region: 'IN',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    senderDomains: ['coinbase.com'],
    assetTypes: ['crypto'],
    region: 'GLOBAL',
  },
  {
    id: 'binance',
    name: 'Binance',
    senderDomains: ['binance.com'],
    assetTypes: ['crypto'],
    region: 'GLOBAL',
  },
  {
    id: 'paytmmoney',
    name: 'Paytm Money',
    senderDomains: ['paytmmoney.com'],
    assetTypes: ['stock', 'mf', 'etf'],
    region: 'IN',
  },
  {
    id: 'angelone',
    name: 'Angel One',
    senderDomains: ['angelone.in', 'angelbroking.com'],
    gmailSearchTerms: ['angelone.in', 'angelbroking.com'],
    assetTypes: ['stock', 'etf'],
    region: 'IN',
  },
  {
    id: 'upstox',
    name: 'Upstox',
    senderDomains: ['upstox.com'],
    assetTypes: ['stock', 'etf', 'mf'],
    region: 'IN',
  },
  {
    id: 'kfintech',
    name: 'KFintech (Indian MFs)',
    senderDomains: ['kfintech.com'],
    gmailSearchTerms: ['kfintech.com'],
    assetTypes: ['mf'],
    region: 'IN',
  },
  {
    id: '21bitcoin',
    name: '21 Bitcoin',
    senderDomains: ['fior.digital'],
    gmailSearchTerms: ['fior.digital'],
    assetTypes: ['crypto'],
    region: 'GLOBAL',
  },
];

export const GET_SETTING = 'SELECT value FROM settings WHERE key = ?';
export const UPSERT_SETTING = 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)';
export const INSERT_TRANSACTION = `
  INSERT INTO transactions (email_id, asset_type, ticker, name, quantity, price, currency, transaction_type, transaction_date, broker, raw_text, confidence)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
export const GET_ALL_TRANSACTIONS = 'SELECT * FROM transactions ORDER BY transaction_date DESC';
export const GET_PRICE_CACHE_AGE = 'SELECT MAX(updated_at) as latest FROM price_cache';
