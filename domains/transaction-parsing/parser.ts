import type { ParseResponse } from '@/domains/shared/types';
import { KNOWN_BROKERS } from '@/domains/shared/constants';
import { getSelectedInstitutions } from '@/domains/email-sync/db';
import { isLikelyTransaction } from './utils';
import { getParser } from './providers';
import { getIgnorePatterns, matchesIgnorePattern } from './pattern-cache';
import { normalizeParsedTransaction } from './normalize';

// Same domains the Gmail fetch searches, so anything we deliberately fetched reaches the LLM.
const getTrustedSenderDomains = (): string[] => [
  ...getSelectedInstitutions().map((institution) => institution.domain),
  ...KNOWN_BROKERS.flatMap((broker) => broker.senderDomains),
];

export const parseEmail = async (
  emailBody: string,
  sender: string,
  subject: string
): Promise<ParseResponse> => {
  if (!isLikelyTransaction(sender, subject, getTrustedSenderDomains())) {
    return {
      transactions: [],
      unparseable: true,
      reason: 'Pre-filter: not a transaction email (sender and subject did not match)',
    };
  }

  const patterns = getIgnorePatterns();
  if (matchesIgnorePattern(sender, subject, patterns)) {
    return {
      transactions: [],
      unparseable: true,
      reason: 'Matched learned ignore pattern',
    };
  }

  const parser = getParser();
  const result = await parser.parse(emailBody, sender, subject);
  return { ...result, transactions: result.transactions.map(normalizeParsedTransaction) };
};
