import type { RawPrice, HistoricalPrice } from '../types';
import { COINGECKO_BASE_URL } from '../constants';

// Free CoinGecko tier serves at most 365 days of market_chart history
const MAX_HISTORY_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

export const fetchCryptoPrice = async (ticker: string): Promise<RawPrice | null> => {
  const coinId = CRYPTO_ID_MAP[ticker.toUpperCase()];
  if (!coinId) return null;

  try {
    const res = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=eur`
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

export const fetchCryptoPriceHistory = async (ticker: string, fromDate: string): Promise<HistoricalPrice[] | null> => {
  const coinId = CRYPTO_ID_MAP[ticker.toUpperCase()];
  if (!coinId) return null;

  try {
    const daysSinceFrom = Math.ceil((Date.now() - new Date(fromDate).getTime()) / MS_PER_DAY);
    const days = Math.min(Math.max(daysSinceFrom, 1), MAX_HISTORY_DAYS);
    const res = await fetch(
      `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=eur&days=${days}`
    );
    const data = await res.json();

    // Granularity varies by range (hourly under 90 days) — keep the last price per day
    const lastPriceByDay = new Map<string, number>();
    for (const [timestampMs, price] of (data?.prices ?? []) as Array<[number, number]>) {
      lastPriceByDay.set(new Date(timestampMs).toISOString().slice(0, 10), price);
    }

    const history = [...lastPriceByDay.entries()]
      .map(([date, price]) => ({ date, price, currency: 'EUR' }))
      .sort((entryA, entryB) => entryA.date.localeCompare(entryB.date));

    return history.length > 0 ? history : null;
  } catch (error) {
    console.error(`CoinGecko history error for ${ticker}:`, error);
    return null;
  }
};
