import type { Holding } from '@/domains/shared/types';

export type CurrencySummary = {
  currency: string;
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
};

export type Summary = {
  byCurrency: CurrencySummary[];
  holdingsCount: number;
  transactionCount: number;
};

export type PortfolioData = {
  summary: Summary;
  holdings: Holding[];
  brokerAllocation: Record<string, number>;
};
