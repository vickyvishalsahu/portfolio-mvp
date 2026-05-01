import { NextResponse } from 'next/server';
import { fetchBrokerEmails, insertRawEmail, getRawEmailCount, getParsedEmailCount, getSelectedInstitutions } from '@/domains/email-sync';
import { getRefreshToken } from '@/domains/email-sync';

export const POST = async () => {
  try {
    if (!getRefreshToken()) {
      return NextResponse.json(
        { error: 'Gmail not connected. Visit /sync to connect.' },
        { status: 400 }
      );
    }

    const institutions = getSelectedInstitutions();
    if (institutions.length === 0) {
      return NextResponse.json(
        { error: 'No institutions selected. Add at least one on the Sync page.' },
        { status: 400 }
      );
    }

    const emails = await fetchBrokerEmails(institutions, 100);

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
};

export const GET = async () => {
  try {
    return NextResponse.json({
      total_raw: getRawEmailCount(),
      total_parsed: getParsedEmailCount(),
      gmail_connected: !!getRefreshToken(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
