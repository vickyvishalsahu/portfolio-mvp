import { NextResponse } from 'next/server';
import { getDb } from '@/domains/shared/db';

export const POST = async () => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const db = getDb();

  const rawEmailsResult = db.prepare('DELETE FROM raw_emails').run();
  const transactionsResult = db.prepare('DELETE FROM transactions').run();
  const priceCacheResult = db.prepare('DELETE FROM price_cache').run();
  const snapshotsResult = db.prepare('DELETE FROM snapshots').run();

  return NextResponse.json({
    deleted: {
      raw_emails: rawEmailsResult.changes,
      transactions: transactionsResult.changes,
      price_cache: priceCacheResult.changes,
      snapshots: snapshotsResult.changes,
    },
  });
};
