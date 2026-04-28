import type { ParseResponse } from '@/domains/shared/types';

export type EmailParser = {
  parse(emailBody: string, sender: string, subject: string): Promise<ParseResponse>;
};
