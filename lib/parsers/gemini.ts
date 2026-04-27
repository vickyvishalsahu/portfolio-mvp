import type { ParseResponse } from '@/domains/shared/types';
import type { EmailParser } from './types';

// Stub — install @google/generative-ai and implement when needed
export class GeminiParser implements EmailParser {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
  }

  async parse(_emailBody: string, _sender: string, _subject: string): Promise<ParseResponse> {
    throw new Error('GeminiParser is not yet implemented. Set AI_PROVIDER=groq to use Groq.');
  }
}
