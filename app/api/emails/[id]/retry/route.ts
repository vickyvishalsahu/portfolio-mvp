import { NextResponse } from 'next/server';
import { retryEmail } from '@/domains/email-sync/db';

export const POST = async (_req: Request, { params }: { params: { id: string } }) => {
  retryEmail(params.id);
  return NextResponse.json({ success: true });
};
