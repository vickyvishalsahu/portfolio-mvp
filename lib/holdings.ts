import { getDb } from '@/domains/shared/db';
import { getPrice, convertToEur, getPrevPrice } from '@/domains/pricing';
import type { Holding, Transaction } from '@/domains/shared/types';

type TransactionRow = {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  price: number;
  currency: string;
  transaction_type: string;
  broker: string;
}

export const computeHoldings = async (): Promise<Holding[]> => {
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
    let totalCostLocal = 0;
    const first = txs[0];

    for (const tx of txs) {
      const priceEur = await convertToEur(tx.price, tx.currency);

      if (tx.transaction_type === 'buy' || tx.transaction_type === 'sip') {
        totalCostEur += tx.quantity * priceEur;
        totalCostLocal += tx.quantity * tx.price;
        totalQty += tx.quantity;
      } else if (tx.transaction_type === 'sell') {
        // Reduce quantity; clamp to 0 so an oversell never corrupts subsequent buys
        if (totalQty > 0) {
          const avgCostEur = totalCostEur / totalQty;
          const avgCostLocal = totalCostLocal / totalQty;
          totalQty = Math.max(0, totalQty - tx.quantity);
          totalCostEur = totalQty * avgCostEur;
          totalCostLocal = totalQty * avgCostLocal;
        }
      }
      // dividends don't affect quantity/cost
    }

    if (totalQty <= 0.0001) continue; // skip fully sold positions

    const avgCostEur = totalCostEur / totalQty;
    const avgCostLocal = totalCostLocal / totalQty;

    // Fetch current price
    const priceData = await getPrice(key, first.asset_type, first.currency);
    const currentPriceEur = priceData?.priceEur ?? avgCostEur;
    const currentPriceLocal = priceData?.priceLocal ?? avgCostLocal;
    const currentValueEur = totalQty * currentPriceEur;
    const currentValueLocal = totalQty * currentPriceLocal;
    const pnl = currentValueEur - totalCostEur;
    const pnlLocal = currentValueLocal - totalCostLocal;
    const pnlPct = totalCostEur > 0 ? (pnl / totalCostEur) * 100 : 0;

    const prevPriceData = getPrevPrice(key);
    const prevPriceEur = prevPriceData?.prev_price_eur ?? null;
    const prevPriceLocal = prevPriceData?.prev_price_local ?? null;
    const prevValueEur = prevPriceEur !== null ? totalQty * prevPriceEur : null;
    const prevValueLocal = prevPriceLocal !== null ? totalQty * prevPriceLocal : null;

    holdings.push({
      ticker: first.ticker || key,
      name: first.name,
      asset_type: first.asset_type,
      quantity: totalQty,
      avg_cost_eur: avgCostEur,
      avg_cost_local: avgCostLocal,
      current_price_eur: currentPriceEur,
      current_price_local: currentPriceLocal,
      current_value_eur: currentValueEur,
      current_value_local: currentValueLocal,
      prev_value_eur: prevValueEur,
      prev_value_local: prevValueLocal,
      pnl,
      pnl_local: pnlLocal,
      pnl_pct: pnlPct,
      currency: first.currency,
      broker: first.broker,
    });
  }

  // Sort by value descending
  holdings.sort((a, b) => b.current_value_eur - a.current_value_eur);
  return holdings;
};
