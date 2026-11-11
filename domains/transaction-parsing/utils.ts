import { TRANSACTION_KEYWORDS } from './constants';

export const isLikelyTransaction = (sender: string, subject: string, trustedSenderDomains: string[]): boolean => {
  const senderLower = sender.toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (trustedSenderDomains.some((domain) => senderLower.includes(domain.toLowerCase()))) return true;
  if (TRANSACTION_KEYWORDS.some((keyword) => subjectLower.includes(keyword))) return true;

  return false;
};
