import { NextResponse } from 'next/server';
import { BROKER_CATALOG } from '@/domains/shared/constants';
import { getSelectedBrokerIds, setSelectedBrokerIds, getBrokerCustomDomains, setBrokerCustomDomains } from '@/domains/email-sync/db';

export const GET = async () => {
  const selected = getSelectedBrokerIds();
  const customDomains = getBrokerCustomDomains();
  return NextResponse.json({ catalog: BROKER_CATALOG, selected, customDomains });
}

export const PUT = async (req: Request) => {
  const body = await req.json();
  const validIds = new Set(BROKER_CATALOG.map((broker) => broker.id));

  if (body.selected !== undefined) {
    const incoming: string[] = Array.isArray(body.selected) ? body.selected : [];
    setSelectedBrokerIds(incoming.filter((id) => validIds.has(id)));
  }

  if (body.customDomains !== undefined) {
    const incoming: Record<string, string[]> = body.customDomains ?? {};
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
