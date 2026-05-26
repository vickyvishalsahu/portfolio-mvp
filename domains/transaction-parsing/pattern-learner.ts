import Groq from 'groq-sdk';
import { getIgnorePatterns, saveIgnorePatterns } from './pattern-cache';
import type { IgnorePattern } from './pattern-cache';

type SkippedEmail = {
  emailId: string;
  subject: string;
  sender?: string;
};

const MIN_DOMAIN_SAMPLES = 3;

const extractDomain = (sender: string): string => {
  const match = sender.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : sender.toLowerCase();
};

const extractKeywordsForDomain = async (
  client: Groq,
  domain: string,
  subjects: string[],
  model: string // Pass model as a parameter
): Promise<string[]> => {
  const response = await client.chat.completions.create({
    model, // Use the model parameter
    messages: [
      {
        role: 'user',
        content: `You are analyzing broker emails that are NOT investment transactions.

Sender domain: ${domain}
Email subjects (all confirmed non-transaction):
${subjects.map((s) => `- ${s}`).join('\n')}

Extract 3–5 short keyword phrases (1–3 words each) that appear in non-transaction emails from this sender and could identify similar emails to skip in future.
Return ONLY a JSON array of lowercase strings. Example: ["newsletter", "new feature", "verify your", "welcome to"]`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 256,
  });

  const text = response.choices[0].message.content ?? '[]';
  try {
    const parsed = JSON.parse(text);
    const keywords: unknown[] = Array.isArray(parsed) ? parsed : (parsed.keywords ?? parsed.patterns ?? []);
    return keywords.filter((k): k is string => typeof k === 'string' && k.length > 0);
  } catch {
    return [];
  }
};

const mergePatterns = (
  existing: IgnorePattern[],
  domain: string,
  newKeywords: string[]
): IgnorePattern[] => {
  const existingIndex = existing.findIndex((p) => p.senderContains === domain);

  if (existingIndex >= 0) {
    const updated = { ...existing[existingIndex] };
    const merged = new Set([...updated.subjectKeywords, ...newKeywords]);
    updated.subjectKeywords = Array.from(merged);
    updated.observedCount += 1;
    return existing.map((p, i) => (i === existingIndex ? updated : p));
  }

  return [
    ...existing,
    { senderContains: domain, subjectKeywords: newKeywords, observedCount: 1 },
  ];
};

export const learnPatternsFromSkipped = async (skipped: SkippedEmail[], model: string): Promise<void> => {
  if (!process.env.GROQ_API_KEY || skipped.length === 0) return;

  const byDomain = new Map<string, string[]>();

  for (const email of skipped) {
    if (!email.sender) continue;
    const domain = extractDomain(email.sender);
    const existing = byDomain.get(domain) ?? [];
    byDomain.set(domain, [...existing, email.subject]);
  }

  const qualifyingDomains = [...byDomain.entries()].filter(
    ([, subjects]) => subjects.length >= MIN_DOMAIN_SAMPLES
  );

  if (qualifyingDomains.length === 0) return;

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  let patterns = getIgnorePatterns();

  for (const [domain, subjects] of qualifyingDomains) {
    try {
      const keywords = await extractKeywordsForDomain(client, domain, subjects, model);
      if (keywords.length > 0) {
        patterns = mergePatterns(patterns, domain, keywords);
      }
    } catch {
      // learner failures are non-fatal — next run will retry
    }
  }

  saveIgnorePatterns(patterns);
};
