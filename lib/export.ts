import type { Transaction } from '@/domains/shared/types';

const escapeField = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildCsv = (transactions: Transaction[]): string => {
  const header = 'date,broker,ticker,name,asset_type,transaction_type,quantity,price,currency';
  const rows = transactions.map((transaction) =>
    [
      transaction.transactionDate,
      transaction.broker,
      transaction.ticker ?? '',
      escapeField(transaction.name),
      transaction.assetType,
      transaction.transactionType,
      transaction.quantity,
      transaction.price,
      transaction.currency,
    ].join(',')
  );
  return [header, ...rows].join('\n');
};
