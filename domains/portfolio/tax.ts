import { getEarliestBuyDates } from '@/domains/shared/db';
import { computeHoldings } from './holdings';
import type { TaxClass, TaxHolding, TaxData } from './types';

const INDIA_BROKERS = new Set(['zerodha', 'cams', 'groww', 'angelone']);
const DE_BROKERS = new Set(['scalable']);
const CRYPTO_BROKERS = new Set(['binance', 'coinbase']);

const LTCG_THRESHOLD_DAYS = 365;

const classifyIndia = (assetType: string, holdingDays: number): TaxClass => {
  if (assetType === 'crypto') return 'FLAT_30';
  return holdingDays > LTCG_THRESHOLD_DAYS ? 'LTCG' : 'STCG';
};

const classifyGermany = (assetType: string, holdingDays: number): TaxClass => {
  if (assetType === 'crypto') return holdingDays > LTCG_THRESHOLD_DAYS ? 'TAX_FREE' : 'TAXABLE';
  return 'TAXABLE';
};

export const computeTaxHoldings = async (): Promise<TaxData> => {
  const { holdings } = await computeHoldings();
  const earliestDates = getEarliestBuyDates();
  const today = new Date();

  const india: TaxHolding[] = [];
  const germany: TaxHolding[] = [];
  let hasDualJurisdiction = false;

  for (const holding of holdings) {
    const key = holding.ticker || holding.name;
    const earliestBuyDate = earliestDates[key];
    if (!earliestBuyDate) continue;

    const holdingDays = Math.floor(
      (today.getTime() - new Date(earliestBuyDate).getTime()) / 86_400_000
    );
    const unrealisedGain = holding.currentValueLocal - holding.avgCostLocal * holding.quantity;

    const base: Omit<TaxHolding, 'jurisdiction' | 'taxClass'> = {
      ticker: holding.ticker,
      name: holding.name,
      assetType: holding.assetType,
      currency: holding.currency,
      broker: holding.broker,
      quantity: holding.quantity,
      unrealisedGain,
      earliestBuyDate,
      holdingDays,
    };

    const broker = holding.broker.toLowerCase();

    if (INDIA_BROKERS.has(broker)) {
      india.push({ ...base, jurisdiction: 'IN', taxClass: classifyIndia(holding.assetType, holdingDays) });
    } else if (DE_BROKERS.has(broker)) {
      germany.push({ ...base, jurisdiction: 'DE', taxClass: classifyGermany(holding.assetType, holdingDays) });
    } else if (CRYPTO_BROKERS.has(broker)) {
      india.push({ ...base, jurisdiction: 'IN', taxClass: 'FLAT_30' });
      germany.push({ ...base, jurisdiction: 'DE', taxClass: classifyGermany(holding.assetType, holdingDays) });
      hasDualJurisdiction = true;
    }
  }

  return { india, germany, hasDualJurisdiction };
};
