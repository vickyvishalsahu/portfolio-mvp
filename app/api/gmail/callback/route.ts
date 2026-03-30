import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/gmail';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Display the refresh token for the user to save in .env.local
    // In a production app you'd store this securely, but for personal use
    // we just need to copy it to the env file once.
    return new NextResponse(
      `<html>
        <head><title>Gmail OAuth Success</title></head>
        <body style="font-family: monospace; padding: 40px; background: #0a0a0a; color: #e5e5e5;">
          <h1 style="color: #22c55e;">Gmail Connected!</h1>
          <p>Add this refresh token to your <code>.env.local</code> file:</p>
          <pre style="background: #1a1a1a; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #333;">GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
          <p style="color: #888;">Then restart your dev server and go to <a href="/sync" style="color: #60a5fa;">/sync</a> to fetch emails.</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'Failed to exchange code for tokens' }, { status: 500 });
  }
}
