import { NextResponse } from 'next/server';
import { fetchBrokerEmails } from '@/lib/gmail';
import {
  insertRawEmail,
  getRawEmailCount,
  getParsedEmailCount,
  getSelectedBrokerIds,
  getBrokerCustomDomains,
} from '@/lib/db';
import { getBrokersByIds } from '@/lib/brokers';
import type { BrokerDefinition } from '@/lib/brokers';

function mergeCustomDomains(
  brokers: BrokerDefinition[],
  customDomains: Record<string, string[]>
): BrokerDefinition[] {
  return brokers.map((b) => {
    const extras = customDomains[b.id] ?? [];
    if (extras.length === 0) return b;
    return {
      ...b,
      senderDomains: [...new Set([...b.senderDomains, ...extras])],
      gmailSearchTerms: [...new Set([...(b.gmailSearchTerms ?? b.senderDomains), ...extras])],
    };
  });
}

export async function POST() {
  try {
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      return NextResponse.json(
        { error: 'Gmail not connected. Visit /api/gmail/auth to connect.' },
        { status: 400 }
      );
    }

    const selectedIds = getSelectedBrokerIds();
    if (selectedIds.length === 0) {
      return NextResponse.json(
        { error: 'No brokers selected. Choose at least one broker on the Sync page.' },
        { status: 400 }
      );
    }

    const brokers = mergeCustomDomains(getBrokersByIds(selectedIds), getBrokerCustomDomains());
    const emails = await fetchBrokerEmails(brokers, 100);

    let newCount = 0;
    for (const email of emails) {
      const result = insertRawEmail(email);
      if (result.changes > 0) newCount++;
    }

    return NextResponse.json({
      fetched: emails.length,
      new: newCount,
      total_raw: getRawEmailCount(),
      total_parsed: getParsedEmailCount(),
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      total_raw: getRawEmailCount(),
      total_parsed: getParsedEmailCount(),
      gmail_connected: !!process.env.GOOGLE_REFRESH_TOKEN,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
