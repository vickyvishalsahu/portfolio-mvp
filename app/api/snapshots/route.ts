import { NextResponse } from 'next/server';
import { getAllSnapshots } from '@/lib/snapshots';

export async function GET() {
  try {
    return NextResponse.json(getAllSnapshots());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
