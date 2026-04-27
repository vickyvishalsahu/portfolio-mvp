import type { ParseResponse } from '@/domains/shared/types';
import { getParser } from './parsers';
import { BROKER_CATALOG } from '@/domains/shared/constants';

// Derived from catalog — single source of truth
const ALL_BROKER_DOMAINS = BROKER_CATALOG.flatMap((b) => b.senderDomains);

// Subject keywords that signal a transaction email
const TRANSACTION_KEYWORDS = [
  'order', 'confirmation', 'confirmed', 'executed', 'purchase', 'bought',
  'sold', 'sell', 'buy', 'sip', 'dividend', 'trade', 'allotment',
  'redemption', 'switch', 'transaction', 'investment', 'demat',
];

function isLikelyTransaction(sender: string, subject: string): boolean {
  const senderLower = sender.toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (ALL_BROKER_DOMAINS.some((domain) => senderLower.includes(domain))) return true;
  if (TRANSACTION_KEYWORDS.some((kw) => subjectLower.includes(kw))) return true;

  return false;
}

export async function parseEmail(
  emailBody: string,
  sender: string,
  subject: string
): Promise<ParseResponse> {
  if (!isLikelyTransaction(sender, subject)) {
    return {
      transactions: [],
      unparseable: true,
      reason: 'Pre-filter: not a transaction email (sender and subject did not match)',
    };
  }

  const parser = getParser();
  return parser.parse(emailBody, sender, subject);
}
