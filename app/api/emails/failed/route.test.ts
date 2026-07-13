import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/domains/email-sync/db', () => ({
  getFailedEmails: vi.fn(),
}));

import { GET } from './route';
import { getFailedEmails } from '@/domains/email-sync/db';

describe('GET /api/emails/failed', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the failed emails from the db layer', async () => {
    const failedEmail = {
      id: 'email-1', sender: 'broker@example.com', subject: 'Trade confirmation',
      body: 'body', receivedAt: '2026-07-01', parsed: 1, parseError: 'LLM returned malformed JSON',
    };
    vi.mocked(getFailedEmails).mockReturnValue([failedEmail]);

    const res = await GET();
    const data = await res.json();

    expect(data.emails).toEqual([failedEmail]);
  });

  it('returns an empty list when nothing has failed', async () => {
    vi.mocked(getFailedEmails).mockReturnValue([]);

    const res = await GET();
    const data = await res.json();

    expect(data.emails).toEqual([]);
  });
});
