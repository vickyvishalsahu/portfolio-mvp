import { getSetting, setSetting } from '@/domains/shared/db';

export type IgnorePattern = {
  senderContains: string;
  subjectKeywords: string[];
  observedCount: number;
};

const SETTINGS_KEY = 'parse_ignore_patterns';

export const getIgnorePatterns = (): IgnorePattern[] => {
  const raw = getSetting(SETTINGS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as IgnorePattern[];
  } catch {
    return [];
  }
};

export const saveIgnorePatterns = (patterns: IgnorePattern[]): void => {
  setSetting(SETTINGS_KEY, JSON.stringify(patterns));
};

export const matchesIgnorePattern = (
  sender: string,
  subject: string,
  patterns: IgnorePattern[]
): boolean => {
  const senderLower = sender.toLowerCase();
  const subjectLower = subject.toLowerCase();

  return patterns.some(
    (pattern) =>
      senderLower.includes(pattern.senderContains) &&
      pattern.subjectKeywords.some((keyword) => subjectLower.includes(keyword))
  );
};
