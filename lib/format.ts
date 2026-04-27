export const fmtEur = (n: number): string =>
  new Intl.NumberFormat('en-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export const fmtLocal = (amount: number, currency: string): string => {
  if (currency === 'INR') {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
    if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Use local currency for non-EUR holdings; EUR for everything else.
export const fmtHolding = (localAmount: number, eurAmount: number, currency: string): string =>
  currency !== 'EUR' ? fmtLocal(localAmount, currency) : fmtEur(eurAmount);

export const pct = (n: number): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
