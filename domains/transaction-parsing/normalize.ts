import type { ParsedTransaction } from '@/domains/shared/types';

// A real ticker/ISIN: uppercase alphanumerics plus . and -, no spaces, 1–20 chars.
const VALID_TICKER = /^[A-Z0-9.\-]{1,20}$/;

const sanitizeTicker = (ticker: string | null): string | null => {
  if (!ticker) return null;
  const trimmed = ticker.trim();
  return VALID_TICKER.test(trimmed) ? trimmed : null;
};

// Collapse runs of whitespace and trim — fixes "Fund -  Regular Plan".
const normalizeName = (name: string): string => name.replace(/\s+/g, ' ').trim();

export const normalizeParsedTransaction = (transaction: ParsedTransaction): ParsedTransaction => ({
  ...transaction,
  ticker: sanitizeTicker(transaction.ticker),
  name: normalizeName(transaction.name),
});
