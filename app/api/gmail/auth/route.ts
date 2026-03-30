import { NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail';

export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
