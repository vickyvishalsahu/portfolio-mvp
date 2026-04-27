import type { ParseResponse } from '@/domains/shared/types';

export interface EmailParser {
  parse(emailBody: string, sender: string, subject: string): Promise<ParseResponse>;
}
