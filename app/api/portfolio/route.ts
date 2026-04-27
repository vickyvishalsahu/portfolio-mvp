import { NextResponse } from 'next/server';
import { getAllTransactions, getPriceCacheAge } from '@/domains/shared/db';
import { computeHoldings } from '@/lib/holdings';
import { recordSnapshot } from '@/lib/snapshots';

export const GET = async () => {
  try {
    const holdings = await computeHoldings();
    const transactions = getAllTransactions();

    // Group totals by source currency — never convert, never sum across currencies
    const byCurrency = holdings.reduce<Record<string, { value: number; cost: number }>>((acc, h) => {
      const cur = h.currency;
      if (!acc[cur]) acc[cur] = { value: 0, cost: 0 };
      acc[cur].value += h.current_value_local;
      acc[cur].cost += h.avg_cost_local * h.quantity;
      return acc;
    }, {});

    const currencySummaries = Object.entries(byCurrency).map(([currency, { value, cost }]) => ({
      currency,
      total_value: value,
      total_pnl: value - cost,
      total_pnl_pct: cost > 0 ? ((value - cost) / cost) * 100 : 0,
    }));

    // Broker allocation uses local values (single-currency meaningful; multi-currency: TODO)
    const brokerAllocation = holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.broker] = (acc[h.broker] || 0) + h.current_value_local;
      return acc;
    }, {});

    const snapshotInput = Object.fromEntries(
      Object.entries(byCurrency).map(([cur, { value }]) => [cur, value])
    );
    if (Object.keys(snapshotInput).length > 0) recordSnapshot(snapshotInput);

    return NextResponse.json({
      summary: {
        by_currency: currencySummaries,
        holdings_count: holdings.length,
        transaction_count: transactions.length,
      },
      holdings,
      broker_allocation: brokerAllocation,
      price_cache_updated_at: getPriceCacheAge(),
    });
  } catch (error: any) {
    console.error('Portfolio error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
