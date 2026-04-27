import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/domains/email-sync';

export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
