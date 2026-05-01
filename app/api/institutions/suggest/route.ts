import { NextRequest, NextResponse } from 'next/server';

type ClearbitSuggestion = { name: string; domain: string; logo: string };

export const GET = async (request: NextRequest) => {
  const query = request.nextUrl.searchParams.get('q');
  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`,
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
