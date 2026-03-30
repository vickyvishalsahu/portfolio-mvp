import { NextResponse } from 'next/server';
import { getAllTransactions } from '@/lib/db';
import { computeHoldings } from '@/lib/holdings';

export async function GET() {
  try {
    const holdings = await computeHoldings();
    const transactions = getAllTransactions();

    const totalValue = holdings.reduce((sum, h) => sum + h.current_value_eur, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.avg_cost_eur * h.quantity, 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return NextResponse.json({
      summary: {
        total_value_eur: totalValue,
        total_cost_eur: totalCost,
        total_pnl: totalPnl,
        total_pnl_pct: totalPnlPct,
        holdings_count: holdings.length,
        transaction_count: transactions.length,
      },
      holdings,
      transactions,
    });
  } catch (error: any) {
    console.error('Portfolio error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
