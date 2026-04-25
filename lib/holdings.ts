import { getDb } from './db';
import { getPrice } from './prices';
import { convertToEur } from './currency';
import type { Holding, Transaction } from '@/types';

interface TransactionRow {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  price: number;
  currency: string;
  transaction_type: string;
  broker: string;
}

export async function computeHoldings(): Promise<Holding[]> {
  const db = getDb();
  const transactions = db.prepare(
    'SELECT ticker, name, asset_type, quantity, price, currency, transaction_type, broker FROM transactions ORDER BY transaction_date ASC'
  ).all() as TransactionRow[];

  // Group by ticker (or name if no ticker)
  const groups = new Map<string, TransactionRow[]>();
  for (const tx of transactions) {
    const key = tx.ticker || tx.name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const holdings: Holding[] = [];

  for (const [key, txs] of groups) {
    let totalQty = 0;
    let totalCostEur = 0;
    const first = txs[0];

    for (const tx of txs) {
      const priceEur = await convertToEur(tx.price, tx.currency);

      if (tx.transaction_type === 'buy' || tx.transaction_type === 'sip') {
        totalCostEur += tx.quantity * priceEur;
        totalQty += tx.quantity;
      } else if (tx.transaction_type === 'sell') {
        // Reduce quantity; clamp to 0 so an oversell never corrupts subsequent buys
        if (totalQty > 0) {
          const avgCost = totalCostEur / totalQty;
          totalQty = Math.max(0, totalQty - tx.quantity);
          totalCostEur = totalQty * avgCost;
        }
      }
      // dividends don't affect quantity/cost
    }

    if (totalQty <= 0.0001) continue; // skip fully sold positions

    const avgCostEur = totalCostEur / totalQty;

    // Fetch current price
    const priceData = await getPrice(key, first.asset_type, first.currency);
    const currentPriceEur = priceData?.priceEur ?? avgCostEur; // fallback to cost if no price
    const currentValueEur = totalQty * currentPriceEur;
    const pnl = currentValueEur - totalCostEur;
    const pnlPct = totalCostEur > 0 ? (pnl / totalCostEur) * 100 : 0;

    holdings.push({
      ticker: first.ticker || key,
      name: first.name,
      asset_type: first.asset_type,
      quantity: totalQty,
      avg_cost_eur: avgCostEur,
      current_price_eur: currentPriceEur,
      current_value_eur: currentValueEur,
      pnl,
      pnl_pct: pnlPct,
      currency: first.currency,
      broker: first.broker,
    });
  }

  // Sort by value descending
  holdings.sort((a, b) => b.current_value_eur - a.current_value_eur);
  return holdings;
}
