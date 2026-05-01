import { NextResponse } from 'next/server';
import { getDb, deleteSetting } from '@/domains/shared/db';

export const POST = async () => {
  const db = getDb();

  const rawEmailsResult = db.prepare('DELETE FROM raw_emails').run();
  const transactionsResult = db.prepare('DELETE FROM transactions').run();
  const priceCacheResult = db.prepare('DELETE FROM price_cache').run();
  const snapshotsResult = db.prepare('DELETE FROM snapshots').run();

  deleteSetting('selected_brokers');
  deleteSetting('broker_custom_domains');
  deleteSetting('custom_institutions');

  return NextResponse.json({
    deleted: {
      raw_emails: rawEmailsResult.changes,
      transactions: transactionsResult.changes,
      price_cache: priceCacheResult.changes,
      snapshots: snapshotsResult.changes,
    },
  });
};
