import type { ParseResponse } from '@/domains/shared/types';
import { isLikelyTransaction } from './utils';
import { getParser } from './providers';

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

  const parser = getParser();
  return parser.parse(emailBody, sender, subject);
};
