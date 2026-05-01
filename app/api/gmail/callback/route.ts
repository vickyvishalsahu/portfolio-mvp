import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/domains/email-sync';
import { setSetting } from '@/domains/shared/db';

export const GET = async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json({ error: 'No refresh token returned. Try revoking access in your Google account and reconnecting.' }, { status: 400 });
    }

    setSetting('google_refresh_token', tokens.refresh_token);
    return NextResponse.redirect(new URL('/sync', request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }
};
