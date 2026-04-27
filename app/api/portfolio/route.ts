import { NextResponse } from 'next/server';
import { getAllTransactions, getPriceCacheAge } from '@/domains/shared/db';
import { computeHoldings } from '@/lib/holdings';
import { recordSnapshot, getSnapshotDelta } from '@/lib/snapshots';

export async function GET() {
  try {
    const holdings = await computeHoldings();
    const transactions = getAllTransactions();

    const totalValue = holdings.reduce((sum, h) => sum + h.current_value_eur, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.avg_cost_eur * h.quantity, 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    const brokerAllocation = holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.broker] = (acc[h.broker] || 0) + h.current_value_eur;
      return acc;
    }, {});

    // Record today's snapshot (INSERT OR IGNORE — safe to call on every load)
    if (totalValue > 0) recordSnapshot(totalValue);

    const value30dAgo = getSnapshotDelta(30);
    const value7dAgo = getSnapshotDelta(7);

    return NextResponse.json({
      summary: {
        total_value_eur: totalValue,
        total_cost_eur: totalCost,
        total_pnl: totalPnl,
        total_pnl_pct: totalPnlPct,
        holdings_count: holdings.length,
        transaction_count: transactions.length,
        delta_30d: value30dAgo !== null ? totalValue - value30dAgo : null,
        delta_7d:  value7dAgo  !== null ? totalValue - value7dAgo  : null,
      },
      holdings,
      transactions,
      broker_allocation: brokerAllocation,
      price_cache_updated_at: getPriceCacheAge(),
    });
  } catch (error: any) {
    console.error('Portfolio error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
