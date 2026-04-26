import { NextResponse } from 'next/server';
import { BROKER_CATALOG } from '@/lib/brokers';
import { getSelectedBrokerIds, setSelectedBrokerIds } from '@/lib/db';

export async function GET() {
  const selected = getSelectedBrokerIds();
  return NextResponse.json({ catalog: BROKER_CATALOG, selected });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const incoming: string[] = Array.isArray(body.selected) ? body.selected : [];
  const validIds = new Set(BROKER_CATALOG.map((b) => b.id));
  const selected = incoming.filter((id) => validIds.has(id));
  setSelectedBrokerIds(selected);
  return NextResponse.json({ selected });
}
