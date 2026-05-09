import type { PriceResult, RawPrice } from './types';
import { getCachedPrice, setCachedPrice } from './db';
import { convertToEur } from './currency';
import { fetchYahooPrice } from './fetchers/yahoo';
import { fetchMfNav } from './fetchers/amfi';
import { fetchCryptoPrice } from './fetchers/crypto';

export const getPrice = async (
  ticker: string,
  assetType: string,
  originalCurrency: string
): Promise<PriceResult | null> => {
  const cached = getCachedPrice(ticker);
  if (cached) {
    return { priceEur: cached.priceEur, priceLocal: cached.priceLocal, currency: cached.currency };
  }

  let result: RawPrice | null = null;

  if (assetType === 'crypto') {
    result = await fetchCryptoPrice(ticker);
  } else if (assetType === 'mf') {
    result = await fetchMfNav(ticker);
  } else {
    let yahooTicker = ticker;
    // Indian stocks need .NS suffix for Yahoo Finance if not already qualified
    if (originalCurrency === 'INR' && !ticker.includes('.')) {
      yahooTicker = `${ticker}.NS`;
    }
    result = await fetchYahooPrice(yahooTicker);
  }

  if (!result) return null;

  const priceEur = result.currency === 'EUR'
    ? result.price
    : await convertToEur(result.price, result.currency);

  setCachedPrice(ticker, priceEur, result.price, result.currency);
  return { priceEur, priceLocal: result.price, currency: result.currency };
};

export const refreshPrices = async (
  tickers: { ticker: string; assetType: string; currency: string }[]
): Promise<{ updated: number; failed: string[] }> => {
  let updated = 0;
  const failed: string[] = [];

  for (const { ticker, assetType, currency } of tickers) {
    const result = await getPrice(ticker, assetType, currency);
    if (result) {
      updated++;
    } else {
      failed.push(ticker);
    }
  }

  return { updated, failed };
};
