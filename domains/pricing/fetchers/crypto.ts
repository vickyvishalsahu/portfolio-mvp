import type { RawPrice } from '../types';
import { COINGECKO_BASE_URL } from '../constants';

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
