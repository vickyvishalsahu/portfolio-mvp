import { describe, it, expect } from 'vitest';
import type { Holding } from '@/domains/shared/types';
import { computeMovers } from './movers';

const makeHolding = (overrides: Partial<Holding> = {}): Holding => ({
  ticker: 'AAPL',
  name: 'Apple Inc',
  assetType: 'stock',
  quantity: 10,
  avgCostEur: 100,
  avgCostLocal: 100,
  currentPriceEur: 110,
  currentPriceLocal: 110,
  currentValueEur: 1100,
  currentValueLocal: 1100,
  prevValueEur: 1000,
  prevValueLocal: 1000,
  pnl: 100,
  pnlLocal: 100,
  pnlPct: 10,
  currency: 'EUR',
  broker: 'scalable',
  ...overrides,
});

describe('computeMovers', () => {
  it('ranks by percent change, not absolute — a big INR move does not outrank a bigger EUR percent move', () => {
    const smallPctBigAbsolute = makeHolding({
      ticker: 'RELIANCE',
      currency: 'INR',
      currentValueLocal: 505000,
      prevValueLocal: 500000, // +₹5,000 = +1%
    });
    const bigPctSmallAbsolute = makeHolding({
      ticker: 'IWDA',
      currency: 'EUR',
      currentValueLocal: 1100,
      prevValueLocal: 1000, // +€100 = +10%
    });

    const movers = computeMovers([smallPctBigAbsolute, bigPctSmallAbsolute]);

    expect(movers[0].ticker).toBe('IWDA');
    expect(movers[1].ticker).toBe('RELIANCE');
  });

  it('computes change in the holding\'s own currency and marks direction', () => {
    const gainer = makeHolding({ currentValueLocal: 1100, prevValueLocal: 1000 });

    const movers = computeMovers([gainer]);

    expect(movers).toHaveLength(1);
    expect(movers[0].change).toBe(100);
    expect(movers[0].changePct).toBeCloseTo(10);
    expect(movers[0].direction).toBe('gain');
  });

  it('lists losers after gainers, most negative percent first', () => {
    const gainer = makeHolding({ ticker: 'UP', currentValueLocal: 1050, prevValueLocal: 1000 });
    const smallLoser = makeHolding({ ticker: 'DOWN1', currentValueLocal: 980, prevValueLocal: 1000 });
    const bigLoser = makeHolding({ ticker: 'DOWN2', currentValueLocal: 900, prevValueLocal: 1000 });

    const movers = computeMovers([smallLoser, gainer, bigLoser]);

    expect(movers.map((mover) => mover.ticker)).toEqual(['UP', 'DOWN2', 'DOWN1']);
    expect(movers[1].direction).toBe('loss');
  });

  it('never labels a negative change as a gain when nothing went up', () => {
    const loserOnly = makeHolding({ ticker: 'DOWN', currentValueLocal: 900, prevValueLocal: 1000 });

    const movers = computeMovers([loserOnly]);

    expect(movers).toHaveLength(1);
    expect(movers[0].direction).toBe('loss');
  });

  it('caps at 3 gainers and 3 losers', () => {
    const gainers = [1, 2, 3, 4].map((index) =>
      makeHolding({ ticker: `UP${index}`, currentValueLocal: 1000 + index * 10, prevValueLocal: 1000 })
    );
    const losers = [1, 2, 3, 4].map((index) =>
      makeHolding({ ticker: `DOWN${index}`, currentValueLocal: 1000 - index * 10, prevValueLocal: 1000 })
    );

    const movers = computeMovers([...gainers, ...losers]);

    expect(movers.filter((mover) => mover.direction === 'gain')).toHaveLength(3);
    expect(movers.filter((mover) => mover.direction === 'loss')).toHaveLength(3);
  });

  it('excludes holdings without a previous value or with a zero previous value', () => {
    const noPrev = makeHolding({ ticker: 'NEW', prevValueLocal: null });
    const zeroPrev = makeHolding({ ticker: 'ZERO', prevValueLocal: 0 });

    expect(computeMovers([noPrev, zeroPrev])).toEqual([]);
  });

  it('excludes unchanged holdings', () => {
    const flat = makeHolding({ currentValueLocal: 1000, prevValueLocal: 1000 });

    expect(computeMovers([flat])).toEqual([]);
  });

  it('returns empty for empty input', () => {
    expect(computeMovers([])).toEqual([]);
  });
});
