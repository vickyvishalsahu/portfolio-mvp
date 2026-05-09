import { NextResponse } from 'next/server';
import { getAllTransactions, getPriceCacheAge } from '@/domains/shared/db';
import { computeHoldings, recordSnapshot } from '@/domains/portfolio';

export const GET = async () => {
  try {
    const holdings = await computeHoldings();
    const transactions = getAllTransactions();

    // Group totals by source currency — never convert, never sum across currencies
    const byCurrency = holdings.reduce<Record<string, { value: number; cost: number }>>((acc, h) => {
      const cur = h.currency;
      if (!acc[cur]) acc[cur] = { value: 0, cost: 0 };
      acc[cur].value += h.currentValueLocal;
      acc[cur].cost += h.avgCostLocal * h.quantity;
      return acc;
    }, {});

    const currencySummaries = Object.entries(byCurrency).map(([currency, { value, cost }]) => ({
      currency,
      totalValue: value,
      totalPnl: value - cost,
      totalPnlPct: cost > 0 ? ((value - cost) / cost) * 100 : 0,
    }));

    const brokerAllocation = holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.broker] = (acc[h.broker] || 0) + h.currentValueLocal;
      return acc;
    }, {});

    const snapshotInput = Object.fromEntries(
      Object.entries(byCurrency).map(([cur, { value }]) => [cur, value])
    );
    if (Object.keys(snapshotInput).length > 0) recordSnapshot(snapshotInput);

    return NextResponse.json({
      summary: {
        byCurrency: currencySummaries,
        holdingsCount: holdings.length,
        transactionCount: transactions.length,
      },
      holdings,
      brokerAllocation,
      priceCacheUpdatedAt: getPriceCacheAge(),
    });
  } catch (error: any) {
    console.error('Portfolio error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
