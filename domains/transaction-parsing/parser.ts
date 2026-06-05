import type { ParseResponse } from '@/domains/shared/types';
import { isLikelyTransaction } from './utils';
import { getParser } from './providers';
import { getIgnorePatterns, matchesIgnorePattern } from './pattern-cache';
import { normalizeParsedTransaction } from './normalize';

export const parseEmail = async (
  emailBody: string,
  sender: string,
  subject: string
): Promise<ParseResponse> => {
  if (!isLikelyTransaction(sender, subject)) {
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
