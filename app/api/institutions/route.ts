import { NextResponse } from 'next/server';
import { getSelectedInstitutions, setSelectedInstitutions } from '@/domains/email-sync/db';

export const GET = async () => {
  return NextResponse.json({ institutions: getSelectedInstitutions() });
};

export const PUT = async (request: Request) => {
  const body = await request.json();
  const institutions = Array.isArray(body.institutions) ? body.institutions : [];
  const validated = institutions.filter(
    (item: unknown): item is { name: string; domain: string } =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as any).name === 'string' &&
      typeof (item as any).domain === 'string'
  );
  setSelectedInstitutions(validated);
  return NextResponse.json({ institutions: getSelectedInstitutions() });
};
