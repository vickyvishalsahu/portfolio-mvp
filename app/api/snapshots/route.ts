import { NextResponse } from 'next/server';
import { getAllSnapshots } from '@/lib/snapshots';

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get('currency') ?? 'INR';
    return NextResponse.json(getAllSnapshots(currency));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
