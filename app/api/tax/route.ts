import { NextResponse } from 'next/server';
import { computeTaxHoldings } from '@/domains/portfolio';

export const GET = async () => {
  try {
    const taxData = await computeTaxHoldings();
    return NextResponse.json(taxData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
