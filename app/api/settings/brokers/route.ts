import { NextResponse } from 'next/server';
import { BROKER_CATALOG } from '@/lib/brokers';
import { getSelectedBrokerIds, setSelectedBrokerIds, getBrokerCustomDomains, setBrokerCustomDomains } from '@/lib/db';

export async function GET() {
  const selected = getSelectedBrokerIds();
  const customDomains = getBrokerCustomDomains();
  return NextResponse.json({ catalog: BROKER_CATALOG, selected, customDomains });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const validIds = new Set(BROKER_CATALOG.map((b) => b.id));

  if (body.selected !== undefined) {
    const incoming: string[] = Array.isArray(body.selected) ? body.selected : [];
    setSelectedBrokerIds(incoming.filter((id) => validIds.has(id)));
  }

  if (body.customDomains !== undefined) {
    const incoming: Record<string, string[]> = body.customDomains ?? {};
    // Only keep entries for valid broker IDs
    const filtered = Object.fromEntries(
      Object.entries(incoming).filter(([id]) => validIds.has(id))
    );
    setBrokerCustomDomains(filtered);
  }

  return NextResponse.json({
    selected: getSelectedBrokerIds(),
    customDomains: getBrokerCustomDomains(),
  });
}
