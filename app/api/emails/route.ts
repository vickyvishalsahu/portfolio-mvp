import { NextResponse } from 'next/server';
import { getDb } from '@/domains/shared/db';

export const GET = async () => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT id, sender, subject, received_at, parsed FROM raw_emails ORDER BY received_at DESC LIMIT 200'
    ).all() as Array<{ id: string; sender: string; subject: string; received_at: string; parsed: number }>;
    const emails = rows.map((row) => ({
      id: row.id,
      sender: row.sender,
      subject: row.subject,
      receivedAt: row.received_at,
      parsed: row.parsed,
    }));
    return NextResponse.json({ emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
