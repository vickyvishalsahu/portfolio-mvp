import { NextResponse } from 'next/server';
import { getExchangeRates } from '@/domains/pricing';

export const GET = async () => {
  try {
    const rates = await getExchangeRates();
    return NextResponse.json(rates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
