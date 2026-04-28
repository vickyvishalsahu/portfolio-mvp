import { createGroqParser } from './groq';
import { createGeminiParser } from './gemini';
import type { EmailParser } from './types';

const SUPPORTED_PROVIDERS = ['groq', 'gemini'] as const;
type Provider = (typeof SUPPORTED_PROVIDERS)[number];

const getProvider = (): Provider => {
  const provider = process.env.AI_PROVIDER?.toLowerCase();

  if (!provider) {
    throw new Error(
      'AI_PROVIDER is not set. Add AI_PROVIDER=groq (or gemini) to your .env.local file.'
    );
  }

  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
    throw new Error(
      `Unsupported AI_PROVIDER "${provider}". Supported options: ${SUPPORTED_PROVIDERS.join(', ')}`
    );
  }

  return provider as Provider;
};

export const getParser = (): EmailParser => {
  const provider = getProvider();

  switch (provider) {
    case 'groq':
      return createGroqParser();
    case 'gemini':
      return createGeminiParser();
  }
};
