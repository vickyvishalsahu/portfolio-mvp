import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeDb } from '@/domains/shared/db';

let testDb: Database.Database;

vi.mock('@/domains/shared/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domains/shared/db')>();
  return { ...actual, getDb: () => testDb };
});

import {
  insertRawEmail,
  getUnparsedEmails,
  markEmailFailed,
  getFailedEmails,
  retryEmail,
  resolveEmail,
} from './db';

const seedEmail = (id: string) =>
  insertRawEmail({ id, sender: 'broker@example.com', subject: 'Trade confirmation', body: 'body', receivedAt: new Date().toISOString() });

beforeEach(() => {
  testDb = new Database(':memory:');
  initializeDb(testDb);
});

describe('markEmailFailed', () => {
  it('stores the error message and marks the email parsed', () => {
    seedEmail('email-1');
    markEmailFailed('email-1', 'LLM returned malformed JSON');
    const failed = getFailedEmails();
    expect(failed).toHaveLength(1);
    expect(failed[0].parseError).toBe('LLM returned malformed JSON');
  });

  it('removes the email from the unparsed queue — stops the silent retry loop', () => {
    seedEmail('email-1');
    markEmailFailed('email-1', 'boom');
    expect(getUnparsedEmails().map((email) => email.id)).not.toContain('email-1');
  });
});

describe('getFailedEmails', () => {
  it('returns only emails with a parse_error set', () => {
    seedEmail('email-1');
    seedEmail('email-2');
    markEmailFailed('email-1', 'boom');
    expect(getFailedEmails().map((email) => email.id)).toEqual(['email-1']);
  });

  it('returns an empty array when nothing has failed', () => {
    seedEmail('email-1');
    expect(getFailedEmails()).toEqual([]);
  });
});

describe('retryEmail', () => {
  it('clears the error and re-queues the email for parsing', () => {
    seedEmail('email-1');
    markEmailFailed('email-1', 'boom');
    retryEmail('email-1');
    expect(getFailedEmails()).toHaveLength(0);
    expect(getUnparsedEmails().map((email) => email.id)).toContain('email-1');
  });
});

describe('resolveEmail', () => {
  it('clears the error without re-queuing the email for parsing', () => {
    seedEmail('email-1');
    markEmailFailed('email-1', 'boom');
    resolveEmail('email-1');
    expect(getFailedEmails()).toHaveLength(0);
    expect(getUnparsedEmails().map((email) => email.id)).not.toContain('email-1');
  });
});
