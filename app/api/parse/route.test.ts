import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/domains/email-sync/db', () => ({
  getUnparsedEmails: vi.fn(),
  markEmailParsed: vi.fn(),
  markEmailFailed: vi.fn(),
}));
vi.mock('@/domains/shared/db', () => ({
  insertTransaction: vi.fn(),
}));
vi.mock('@/domains/transaction-parsing', () => ({
  parseEmail: vi.fn(),
  learnPatternsFromSkipped: vi.fn(),
}));

import { POST } from './route';
import { getUnparsedEmails, markEmailParsed, markEmailFailed } from '@/domains/email-sync/db';
import { parseEmail } from '@/domains/transaction-parsing';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const unparsedEmail = {
  id: 'email-1',
  sender: 'broker@example.com',
  subject: 'Trade confirmation',
  body: 'body',
  receivedAt: '2026-07-01',
  parsed: 0,
  parseError: null,
};

describe('POST /api/parse', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks the email failed and never marks it parsed when parsing throws', async () => {
    vi.mocked(getUnparsedEmails).mockReturnValue([unparsedEmail]);
    vi.mocked(parseEmail).mockRejectedValue(new Error('LLM returned malformed JSON'));

    await POST();
    await flush();

    expect(markEmailFailed).toHaveBeenCalledWith('email-1', 'LLM returned malformed JSON');
    expect(markEmailParsed).not.toHaveBeenCalled();
  });

  it('marks the email parsed, not failed, when parsing succeeds', async () => {
    vi.mocked(getUnparsedEmails).mockReturnValue([unparsedEmail]);
    vi.mocked(parseEmail).mockResolvedValue({ transactions: [], unparseable: false, reason: null });

    await POST();
    await flush();

    expect(markEmailParsed).toHaveBeenCalledWith('email-1');
    expect(markEmailFailed).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the thrown error has none', async () => {
    vi.mocked(getUnparsedEmails).mockReturnValue([unparsedEmail]);
    vi.mocked(parseEmail).mockRejectedValue(new Error());

    await POST();
    await flush();

    expect(markEmailFailed).toHaveBeenCalledWith('email-1', 'Parse failed');
  });
});
