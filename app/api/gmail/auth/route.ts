import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/domains/email-sync';

export const GET = async () => {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
