import { NextResponse } from 'next/server';

// Replaced by /api/institutions
export const GET = async () => NextResponse.json({ error: 'Use /api/institutions' }, { status: 410 });
export const PUT = async () => NextResponse.json({ error: 'Use /api/institutions' }, { status: 410 });
