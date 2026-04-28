import { NextResponse } from 'next/server';
import { getDb } from '@/domains/shared/db';
import { refreshPrices } from '@/domains/pricing';

export const POST = async () => {
  try {
    const db = getDb();
    const tickers = db.prepare(
      `SELECT DISTINCT
        COALESCE(ticker, name) as ticker,
        asset_type,
        currency
      FROM transactions`
    ).all() as { ticker: string; asset_type: string; currency: string }[];

    if (tickers.length === 0) {
      return NextResponse.json({ message: 'No holdings to price', updated: 0, failed: [] });
    }

    const result = await refreshPrices(tickers);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Price refresh error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
