import { getAllTransactions } from '@/domains/shared/db';
import { getPriceHistory } from '@/domains/pricing';
import type { PriceHistoryRow } from '@/domains/pricing';
import type { Transaction } from '@/domains/shared/types';
import { getAllSnapshots } from './snapshots';
import { groupKey } from './holdings';

export type PortfolioHistoryPoint = { date: string; totalValue: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const nextDay = (dateIso: string): string =>
  new Date(new Date(dateIso).getTime() + MS_PER_DAY).toISOString().slice(0, 10);

// Reconstructs daily net worth per currency from the first transaction to today, carrying
// the last known price forward across gaps (weekends, holidays, a fetch that hasn't run yet).
// Never sums across currencies — same rule as computeHoldings and the portfolio API.
export const computePortfolioHistory = (
  transactions: Transaction[],
  priceHistoryByKey: Record<string, PriceHistoryRow[]>,
  today: string = new Date().toISOString().slice(0, 10)
): Record<string, PortfolioHistoryPoint[]> => {
  if (transactions.length === 0) return {};

  const transactionsByDate = new Map<string, Transaction[]>();
  const currencyByKey = new Map<string, string>();
  const currencies = new Set<string>();
  let startDate = transactions[0].transactionDate;

  for (const transaction of transactions) {
    if (transaction.transactionDate < startDate) startDate = transaction.transactionDate;
    const key = groupKey(transaction);
    if (!transactionsByDate.has(transaction.transactionDate)) transactionsByDate.set(transaction.transactionDate, []);
    transactionsByDate.get(transaction.transactionDate)!.push(transaction);
    currencyByKey.set(key, transaction.currency);
    currencies.add(transaction.currency);
  }

  const priceByKeyAndDate = new Map<string, Map<string, number>>();
  for (const [key, rows] of Object.entries(priceHistoryByKey)) {
    priceByKeyAndDate.set(key, new Map(rows.map((row) => [row.date, row.priceLocal])));
  }

  const pointsByCurrency: Record<string, PortfolioHistoryPoint[]> = {};
  for (const currency of currencies) pointsByCurrency[currency] = [];

  const quantityByKey = new Map<string, number>();
  const lastKnownPriceByKey = new Map<string, number>();

  for (let date = startDate; date <= today; date = nextDay(date)) {
    for (const transaction of transactionsByDate.get(date) ?? []) {
      const key = groupKey(transaction);
      const currentQuantity = quantityByKey.get(key) ?? 0;

      if (transaction.transactionType === 'buy' || transaction.transactionType === 'sip') {
        quantityByKey.set(key, currentQuantity + transaction.quantity);
        if (!lastKnownPriceByKey.has(key)) lastKnownPriceByKey.set(key, transaction.price);
      } else if (transaction.transactionType === 'sell') {
        quantityByKey.set(key, Math.max(0, currentQuantity - transaction.quantity));
      }
      // dividends don't change quantity, matching computeHoldings
    }

    for (const [key, pricesByDate] of priceByKeyAndDate) {
      const priceToday = pricesByDate.get(date);
      if (priceToday !== undefined) lastKnownPriceByKey.set(key, priceToday);
    }

    const totalByCurrency = new Map<string, number>();
    for (const [key, quantity] of quantityByKey) {
      if (quantity <= 0) continue;
      const price = lastKnownPriceByKey.get(key);
      if (price === undefined) continue;
      const currency = currencyByKey.get(key)!;
      totalByCurrency.set(currency, (totalByCurrency.get(currency) ?? 0) + quantity * price);
    }

    for (const currency of currencies) {
      pointsByCurrency[currency].push({ date, totalValue: totalByCurrency.get(currency) ?? 0 });
    }
  }

  return pointsByCurrency;
};

export const getPortfolioHistory = (currency: string): PortfolioHistoryPoint[] => {
  const transactions = getAllTransactions();
  if (transactions.length === 0) return getAllSnapshots(currency);

  const keys = new Set(transactions.map((transaction) => groupKey(transaction)));
  const priceHistoryByKey: Record<string, PriceHistoryRow[]> = {};
  for (const key of keys) priceHistoryByKey[key] = getPriceHistory(key);

  const hasAnyPriceHistory = Object.values(priceHistoryByKey).some((rows) => rows.length > 0);
  if (!hasAnyPriceHistory) return getAllSnapshots(currency);

  const historyByCurrency = computePortfolioHistory(transactions, priceHistoryByKey);
  return historyByCurrency[currency] ?? getAllSnapshots(currency);
};
