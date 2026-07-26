export const CACHE_TTL = 15 * 60 * 1000; // 15 minutes — shared by price cache and rate cache

export const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/EUR';
export const AMFI_BASE_URL = 'https://api.mfapi.in/mf';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

export const GET_CACHED_PRICE = 'SELECT * FROM price_cache WHERE ticker = ?';
export const GET_EXISTING_PRICE = 'SELECT price_eur, price_local FROM price_cache WHERE ticker = ?';
export const GET_PREV_PRICE = 'SELECT prev_price_eur, prev_price_local FROM price_cache WHERE ticker = ?';
export const UPSERT_PRICE = `
  INSERT OR REPLACE INTO price_cache (ticker, price_eur, prev_price_eur, price_local, prev_price_local, currency, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

export const UPSERT_PRICE_HISTORY = 'INSERT OR IGNORE INTO price_history (ticker, date, price_local, currency) VALUES (?, ?, ?, ?)';
export const GET_PRICE_HISTORY = 'SELECT ticker, date, price_local, currency FROM price_history WHERE ticker = ? ORDER BY date ASC';
export const GET_LATEST_HISTORY_DATE = 'SELECT MAX(date) AS latest_date FROM price_history WHERE ticker = ?';
