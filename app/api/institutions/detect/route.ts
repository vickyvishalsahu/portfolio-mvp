import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthenticatedClient, getRefreshToken } from '@/domains/email-sync';
import { KNOWN_BROKERS } from '@/domains/shared/constants';
import type { Institution } from '@/domains/shared/types';

export const GET = async () => {
  if (!getRefreshToken()) {
    return NextResponse.json({ error: 'Gmail not connected' }, { status: 400 });
  }

  try {
    const auth = getAuthenticatedClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const brokerChecks = KNOWN_BROKERS.map(async (broker) => {
      const domainChecks = broker.senderDomains.map((domain) =>
        gmail.users.messages
          .list({ userId: 'me', q: `from:${domain}`, maxResults: 1 })
          .then((res) => (res.data.messages?.length ?? 0) > 0)
          .catch(() => false)
      );
      const results = await Promise.all(domainChecks);
      const matchedIndex = results.findIndex((found) => found);
      if (matchedIndex === -1) return null;
      return { name: broker.name, domain: broker.senderDomains[matchedIndex] } satisfies Institution;
    });

    const results = await Promise.all(brokerChecks);
    const detected = results.filter((r): r is Institution => r !== null);

    return NextResponse.json({ detected });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
