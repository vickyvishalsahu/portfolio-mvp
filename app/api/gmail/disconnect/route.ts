import { NextResponse } from 'next/server';
import { getRefreshToken } from '@/domains/email-sync';
import { deleteSetting } from '@/domains/shared/db';

export const POST = async () => {
  try {
    const token = getRefreshToken();

    if (token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, { method: 'POST' });
    }

    deleteSetting('google_refresh_token');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: error.message || 'Disconnect failed' }, { status: 500 });
  }
};
