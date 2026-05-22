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

export type TaxClass = 'LTCG' | 'STCG' | 'FLAT_30' | 'TAXABLE' | 'TAX_FREE';
export type Jurisdiction = 'IN' | 'DE';

export type TaxHolding = {
  ticker: string;
  name: string;
  assetType: string;
  currency: string;
  broker: string;
  quantity: number;
  unrealisedGain: number;
  earliestBuyDate: string;
  holdingDays: number;
  jurisdiction: Jurisdiction;
  taxClass: TaxClass;
};

export type TaxData = {
  india: TaxHolding[];
  germany: TaxHolding[];
  hasDualJurisdiction: boolean;
};
