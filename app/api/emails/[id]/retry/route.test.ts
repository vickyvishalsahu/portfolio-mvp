import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/domains/email-sync/db', () => ({
  retryEmail: vi.fn(),
}));

import { POST } from './route';
import { retryEmail } from '@/domains/email-sync/db';

const makeRequest = () => new Request('http://localhost/api/emails/email-1/retry', { method: 'POST' });

describe('POST /api/emails/[id]/retry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('re-queues the given email for parsing', async () => {
    const res = await POST(makeRequest(), { params: { id: 'email-1' } });
    const data = await res.json();

    expect(retryEmail).toHaveBeenCalledWith('email-1');
    expect(data.success).toBe(true);
  });
});
