import { NextResponse } from 'next/server';
import { getFailedEmails } from '@/domains/email-sync/db';

export const GET = async () => {
  const emails = getFailedEmails();
  return NextResponse.json({ emails });
};
