import { BROKER_CATALOG } from '@/domains/shared/constants';
import { TRANSACTION_KEYWORDS } from './constants';

const ALL_BROKER_DOMAINS = BROKER_CATALOG.flatMap((broker) => broker.senderDomains);

export const isLikelyTransaction = (sender: string, subject: string): boolean => {
  const senderLower = sender.toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (ALL_BROKER_DOMAINS.some((domain) => senderLower.includes(domain))) return true;
  if (TRANSACTION_KEYWORDS.some((keyword) => subjectLower.includes(keyword))) return true;

  return false;
};
