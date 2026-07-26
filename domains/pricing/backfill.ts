import type { HistoricalPrice } from './types';
import { upsertPriceHistory, getLatestHistoryDate } from './history';
import { fetchYahooPriceHistory } from './fetchers/yahoo';
import { fetchMfNavHistory } from './fetchers/amfi';
import { fetchCryptoPriceHistory } from './fetchers/crypto';

export type BackfillTarget = {
  ticker: string;
  assetType: string;
  currency: string;
  fromDate: string;
};

export type BackfillOptions = {
  cryptoDelayMs?: number;
  onProgress?: (current: number, total: number) => void;
};

export type BackfillResult = {
  updated: number;
  failed: string[];
};

// Free CoinGecko allows ~10 requests/minute — space out consecutive crypto calls
const DEFAULT_CRYPTO_DELAY_MS = 6000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dayAfter = (isoDate: string): string =>
  new Date(new Date(isoDate).getTime() + MS_PER_DAY).toISOString().slice(0, 10);

const sleep = (durationMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

const fetchHistoryForTarget = async (target: BackfillTarget, fromDate: string): Promise<HistoricalPrice[] | null> => {
  if (target.assetType === 'crypto') {
    return fetchCryptoPriceHistory(target.ticker, fromDate);
  }
  if (target.assetType === 'mf') {
    return fetchMfNavHistory(target.ticker, fromDate);
  }
  // Indian stocks need the .NS suffix for Yahoo, same rule as getPrice
  const yahooTicker = target.currency === 'INR' && !target.ticker.includes('.')
    ? `${target.ticker}.NS`
    : target.ticker;
  return fetchYahooPriceHistory(yahooTicker, fromDate);
};

export const backfillPriceHistory = async (
  targets: BackfillTarget[],
  options: BackfillOptions = {}
): Promise<BackfillResult> => {
  const cryptoDelayMs = options.cryptoDelayMs ?? DEFAULT_CRYPTO_DELAY_MS;
  const today = new Date().toISOString().slice(0, 10);

  let updated = 0;
  const failed: string[] = [];
  let cryptoCallsMade = 0;

  for (let index = 0; index < targets.length; index++) {
    const target = targets[index];
    options.onProgress?.(index + 1, targets.length);

    const latestStoredDate = getLatestHistoryDate(target.ticker);
    const fromDate = latestStoredDate ? dayAfter(latestStoredDate) : target.fromDate;

    if (fromDate > today) {
      updated++;
      continue;
    }

    if (target.assetType === 'crypto') {
      if (cryptoCallsMade > 0 && cryptoDelayMs > 0) await sleep(cryptoDelayMs);
      cryptoCallsMade++;
    }

    const history = await fetchHistoryForTarget(target, fromDate);
    if (!history) {
      failed.push(target.ticker);
      continue;
    }

    upsertPriceHistory(history.map((entry) => ({
      ticker: target.ticker,
      date: entry.date,
      priceLocal: entry.price,
      currency: entry.currency,
    })));
    updated++;
  }

  return { updated, failed };
};
