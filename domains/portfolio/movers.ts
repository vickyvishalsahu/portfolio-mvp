import type { Holding } from '@/domains/shared/types';

const TOP_MOVERS_COUNT = 3;

export type MoverItem = {
  ticker: string;
  name: string;
  currency: string;
  change: number;
  changePct: number;
  direction: 'gain' | 'loss';
};

// Rank by percent, never by absolute change — absolute values are in different
// currencies (₹5,000 vs €100) and comparing them across holdings would blend
// currencies, which this product never does.
export const computeMovers = (holdings: Holding[]): MoverItem[] => {
  const withChange = holdings
    .filter((holding) => holding.prevValueLocal !== null && holding.prevValueLocal !== 0)
    .map((holding) => {
      const change = holding.currentValueLocal - holding.prevValueLocal!;
      const changePct = (change / holding.prevValueLocal!) * 100;
      return { ticker: holding.ticker, name: holding.name, currency: holding.currency, change, changePct };
    })
    .sort((moverA, moverB) => moverB.changePct - moverA.changePct);

  const gainers: MoverItem[] = withChange
    .filter((mover) => mover.change > 0)
    .slice(0, TOP_MOVERS_COUNT)
    .map((mover) => ({ ...mover, direction: 'gain' }));

  const losers: MoverItem[] = withChange
    .filter((mover) => mover.change < 0)
    .reverse()
    .slice(0, TOP_MOVERS_COUNT)
    .map((mover) => ({ ...mover, direction: 'loss' }));

  return [...gainers, ...losers];
};
