import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeDb } from '@/domains/shared/db';
import type { ParseResponse } from '@/domains/shared/types';

let testDb: Database.Database;

vi.mock('@/domains/shared/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domains/shared/db')>();
  return { ...actual, getDb: () => testDb };
});

const llmParse = vi.fn(async (): Promise<ParseResponse> => ({ transactions: [], unparseable: true, reason: 'stub' }));

vi.mock('./providers', () => ({ getParser: () => ({ parse: llmParse }) }));

import { parseEmail } from './parser';
import { setSelectedInstitutions } from '@/domains/email-sync/db';

const PRE_FILTER_REASON = 'Pre-filter: not a transaction email (sender and subject did not match)';

beforeEach(() => {
  testDb = new Database(':memory:');
  initializeDb(testDb);
  llmParse.mockClear();
});

describe('parseEmail pre-filter', () => {
  it('sends an email from a selected institution to the LLM even without a transaction keyword', async () => {
    setSelectedInstitutions([{ name: 'Example Bank', domain: 'examplebank.com' }]);

    await parseEmail('body', 'Statements <noreply@examplebank.com>', 'Your monthly statement');

    expect(llmParse).toHaveBeenCalledOnce();
  });

  it('sends an email from a known broker domain to the LLM even without a transaction keyword', async () => {
    await parseEmail('body', 'CAMS <donotreply@camsonline.com>', 'Statement of Account for Folio No. 123');

    expect(llmParse).toHaveBeenCalledOnce();
  });

  it('still skips an unknown sender whose subject has no transaction keyword', async () => {
    setSelectedInstitutions([{ name: 'Example Bank', domain: 'examplebank.com' }]);

    const result = await parseEmail('body', 'Shop <deals@shop.example>', 'Your weekly deals');

    expect(llmParse).not.toHaveBeenCalled();
    expect(result.reason).toBe(PRE_FILTER_REASON);
  });

  it('still lets an unknown sender through when the subject has a transaction keyword', async () => {
    await parseEmail('body', 'Someone <hi@unknown.example>', 'Order executed');

    expect(llmParse).toHaveBeenCalledOnce();
  });
});
