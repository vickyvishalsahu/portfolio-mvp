import type { Transaction } from '@/domains/shared/types';

const escapeField = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildCsv = (transactions: Transaction[]): string => {
  const header = 'date,broker,ticker,name,asset_type,transaction_type,quantity,price,currency';
  const rows = transactions.map((t) =>
    [
      t.transaction_date,
      t.broker,
      t.ticker ?? '',
      escapeField(t.name),
      t.asset_type,
      t.transaction_type,
      t.quantity,
      t.price,
      t.currency,
    ].join(',')
  );
  return [header, ...rows].join('\n');
};
