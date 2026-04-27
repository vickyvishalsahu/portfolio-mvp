import YahooFinance from 'yahoo-finance2';
import { getDb } from '@/domains/shared/db';
import { convertToEur } from './currency';

const yahooFinance = new YahooFinance();

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

type CachedPrice = {
  ticker: string;
  price_eur: number;
  price_local: number;
  currency: string;
  updated_at: string;
}

const getCachedPrice = (ticker: string): CachedPrice | null => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM price_cache WHERE ticker = ?').get(ticker) as CachedPrice | undefined;
  if (!row) return null;

  const age = Date.now() - new Date(row.updated_at).getTime();
  if (age > CACHE_TTL) return null;

  return row;
};

const setCachedPrice = (ticker: string, priceEur: number, priceLocal: number, currency: string) => {
  const db = getDb();
  const existing = db.prepare('SELECT price_eur, price_local FROM price_cache WHERE ticker = ?').get(ticker) as { price_eur: number; price_local: number } | undefined;
  db.prepare(`
    INSERT OR REPLACE INTO price_cache (ticker, price_eur, prev_price_eur, price_local, prev_price_local, currency, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ticker, priceEur, existing?.price_eur ?? null, priceLocal, existing?.price_local ?? null, currency, new Date().toISOString());
};

// Yahoo Finance for stocks and ETFs
const fetchYahooPrice = async (ticker: string): Promise<{ price: number; currency: string } | null> => {
  try {
    const quote = await yahooFinance.quote(ticker);
    if (quote?.regularMarketPrice && quote?.currency) {
      return { price: quote.regularMarketPrice, currency: quote.currency };
    }
    return null;
  } catch (error) {
    console.error(`Yahoo Finance error for ${ticker}:`, error);
    return null;
  }
};

// AMFI API for Indian mutual fund NAVs
const fetchMfNav = async (isinOrScheme: string): Promise<{ price: number; currency: string } | null> => {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(isinOrScheme)}`);
    const results = await res.json();

    if (results.length === 0) return null;

    const schemeCode = results[0].schemeCode;
    const navRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
    const navData = await navRes.json();

    if (navData?.data?.[0]?.nav) {
      return { price: parseFloat(navData.data[0].nav), currency: 'INR' };
    }
    return null;
  } catch (error) {
    console.error(`AMFI NAV error for ${isinOrScheme}:`, error);
    return null;
  }
};

// CoinGecko for crypto
const CRYPTO_ID_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  DOGE: 'dogecoin',
  XRP: 'ripple',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  BNB: 'binancecoin',
  USDT: 'tether',
  USDC: 'usd-coin',
};

const fetchCryptoPrice = async (ticker: string): Promise<{ price: number; currency: string } | null> => {
  const coinId = CRYPTO_ID_MAP[ticker.toUpperCase()];
  if (!coinId) return null;

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=eur`
    );
    const data = await res.json();

    if (data[coinId]?.eur) {
      return { price: data[coinId].eur, currency: 'EUR' };
    }
    return null;
  } catch (error) {
    console.error(`CoinGecko error for ${ticker}:`, error);
    return null;
  }
};

export const getPrice = async (
  ticker: string,
  assetType: string,
  originalCurrency: string
): Promise<{ priceEur: number; priceLocal: number; currency: string } | null> => {
  // Check cache first
  const cached = getCachedPrice(ticker);
  if (cached) {
    return { priceEur: cached.price_eur, priceLocal: cached.price_local, currency: cached.currency };
  }

  let result: { price: number; currency: string } | null = null;

  if (assetType === 'crypto') {
    result = await fetchCryptoPrice(ticker);
  } else if (assetType === 'mf') {
    result = await fetchMfNav(ticker);
  } else {
    // stocks and ETFs via Yahoo
    let yahooTicker = ticker;
    // Add .NS suffix for Indian stocks if not already present
    if (originalCurrency === 'INR' && !ticker.includes('.')) {
      yahooTicker = `${ticker}.NS`;
    }
    result = await fetchYahooPrice(yahooTicker);
  }

  if (!result) return null;

  let priceEur: number;
  if (result.currency === 'EUR') {
    priceEur = result.price;
  } else {
    priceEur = await convertToEur(result.price, result.currency);
  }

  setCachedPrice(ticker, priceEur, result.price, result.currency);
  return { priceEur, priceLocal: result.price, currency: result.currency };
};

export const refreshPrices = async (
  tickers: { ticker: string; asset_type: string; currency: string }[]
): Promise<{ updated: number; failed: string[] }> => {
  let updated = 0;
  const failed: string[] = [];

  for (const { ticker, asset_type, currency } of tickers) {
    const result = await getPrice(ticker, asset_type, currency);
    if (result) {
      updated++;
    } else {
      failed.push(ticker);
    }
  }

  return { updated, failed };
};
