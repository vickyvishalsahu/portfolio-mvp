import { describe, it, expect } from 'vitest';
import { xirr, buildCashflows } from './xirr';

describe('xirr', () => {
  it('returns null for fewer than 2 cashflows', () => {
    expect(xirr([])).toBeNull();
    expect(xirr([{ date: '2026-01-01', amount: -1000 }])).toBeNull();
  });

  it('returns null when every cashflow is the same sign — no rate can reconcile an all-outflow or all-inflow series', () => {
    const allNegative = [
      { date: '2026-01-01', amount: -1000 },
      { date: '2026-06-01', amount: -500 },
    ];
    const allPositive = [
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-06-01', amount: 500 },
    ];

    expect(xirr(allNegative)).toBeNull();
    expect(xirr(allPositive)).toBeNull();
  });

  it('hand-computed case: -1000 then +1100 exactly one year later is ~10%', () => {
    const rate = xirr([
      { date: '2026-01-01', amount: -1000 },
      { date: '2027-01-01', amount: 1100 },
    ]);

    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(0.1, 6);
  });

  it('hand-computed loss case: -1000 then +900 exactly one year later is ~-10%', () => {
    const rate = xirr([
      { date: '2026-01-01', amount: -1000 },
      { date: '2027-01-01', amount: 900 },
    ]);

    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(-0.1, 6);
  });

  it('multi-flow case verified independently against a plain bisection solver: ~37.336%', () => {
    // The classic 5-flow example used to sanity-check spreadsheet XIRR implementations.
    const rate = xirr([
      { date: '2008-01-01', amount: -10000 },
      { date: '2008-03-01', amount: 2750 },
      { date: '2008-10-30', amount: 4250 },
      { date: '2009-02-15', amount: 3250 },
      { date: '2009-04-01', amount: 2750 },
    ]);

    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(0.373363, 4);
  });

  it('resolves a near-total-loss holding close to -100% instead of giving up', () => {
    // -1,000,000 collapsing to +1,000 exactly one year later: (1+r) = 1000/1_000_000 = 0.001.
    const rate = xirr([
      { date: '2026-01-01', amount: -1_000_000 },
      { date: '2027-01-01', amount: 1000 },
    ]);

    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(-0.999, 6);
  });

  it('is order-independent — cashflows are sorted internally', () => {
    const inOrder = xirr([
      { date: '2026-01-01', amount: -1000 },
      { date: '2027-01-01', amount: 1100 },
    ]);
    const shuffled = xirr([
      { date: '2027-01-01', amount: 1100 },
      { date: '2026-01-01', amount: -1000 },
    ]);

    expect(shuffled).toBeCloseTo(inOrder!, 9);
  });
});

describe('buildCashflows', () => {
  const currentValueLocal = 1200;
  const asOfDate = '2026-06-15';

  it('treats buy and sip as outflows, sell and dividend as inflows', () => {
    const cashflows = buildCashflows(
      [
        { transactionType: 'buy', transactionDate: '2026-01-01', quantity: 10, price: 100 },
        { transactionType: 'sip', transactionDate: '2026-02-01', quantity: 5, price: 100 },
        { transactionType: 'sell', transactionDate: '2026-03-01', quantity: 3, price: 110 },
        { transactionType: 'dividend', transactionDate: '2026-04-01', quantity: 10, price: 2 },
      ],
      currentValueLocal,
      asOfDate
    );

    expect(cashflows).toEqual([
      { date: '2026-01-01', amount: -1000 },
      { date: '2026-02-01', amount: -500 },
      { date: '2026-03-01', amount: 330 },
      { date: '2026-04-01', amount: 20 },
      { date: asOfDate, amount: currentValueLocal },
    ]);
  });

  it('appends exactly one terminal flow using the current value on the given date', () => {
    const cashflows = buildCashflows(
      [{ transactionType: 'buy', transactionDate: '2026-01-01', quantity: 1, price: 100 }],
      currentValueLocal,
      asOfDate
    );

    expect(cashflows.at(-1)).toEqual({ date: asOfDate, amount: currentValueLocal });
  });

  it('defaults the terminal flow date to today when none is given', () => {
    const today = new Date().toISOString().slice(0, 10);

    const cashflows = buildCashflows(
      [{ transactionType: 'buy', transactionDate: '2026-01-01', quantity: 1, price: 100 }],
      currentValueLocal
    );

    expect(cashflows.at(-1)!.date).toBe(today);
  });
});
