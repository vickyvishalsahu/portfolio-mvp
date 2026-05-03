import { NextRequest, NextResponse } from 'next/server';
import { CLEARBIT_SUGGEST_URL } from '@/domains/email-sync/constants';

type ClearbitSuggestion = { name: string; domain: string; logo: string };

export const GET = async (request: NextRequest) => {
  const query = request.nextUrl.searchParams.get('q');
  const isTooShort = !query || query.trim().length < 2;
  if (isTooShort) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `${CLEARBIT_SUGGEST_URL}?query=${encodeURIComponent(query)}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return NextResponse.json([]);

    const suggestions: ClearbitSuggestion[] = await response.json();
    return NextResponse.json(suggestions.slice(0, 8).map((suggestion) => ({
      name: suggestion.name,
      domain: suggestion.domain,
      logo: suggestion.logo,
    })));
  } catch {
    return NextResponse.json([]);
  }
};
