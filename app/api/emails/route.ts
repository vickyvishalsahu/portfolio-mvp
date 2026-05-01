import { NextResponse } from 'next/server';
import { getDb } from '@/domains/shared/db';

export const GET = async () => {
  try {
    const db = getDb();
    const emails = db.prepare(
      'SELECT id, sender, subject, received_at, parsed FROM raw_emails ORDER BY received_at DESC LIMIT 200'
    ).all();
    return NextResponse.json({ emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
