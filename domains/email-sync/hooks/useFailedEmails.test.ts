// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFailedEmails } from './useFailedEmails';

const failedEmail = {
  id: 'email-1', sender: 'broker@example.com', subject: 'Trade confirmation',
  body: 'body', receivedAt: '2026-07-01', parsed: 1, parseError: 'LLM returned malformed JSON',
};

describe('useFailedEmails', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads failed emails on mount', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ emails: [failedEmail] }),
    });

    const { result } = renderHook(() => useFailedEmails());

    await waitFor(() => expect(result.current.failedEmails).toEqual([failedEmail]));
    expect(fetch).toHaveBeenCalledWith('/api/emails/failed');
  });

  it('retry posts to the retry endpoint and refetches the list', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ json: async () => ({ emails: [failedEmail] }) })
      .mockResolvedValueOnce({ json: async () => ({ success: true }) })
      .mockResolvedValueOnce({ json: async () => ({ emails: [] }) });

    const { result } = renderHook(() => useFailedEmails());
    await waitFor(() => expect(result.current.failedEmails).toEqual([failedEmail]));

    await act(async () => {
      await result.current.retry('email-1');
    });

    expect(fetch).toHaveBeenCalledWith('/api/emails/email-1/retry', { method: 'POST' });
    expect(result.current.failedEmails).toEqual([]);
  });

  it('tracks which email is currently retrying', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ json: async () => ({ emails: [failedEmail] }) });
    const { result } = renderHook(() => useFailedEmails());
    await waitFor(() => expect(result.current.failedEmails).toEqual([failedEmail]));

    let resolveRetry: (value: unknown) => void = () => {};
    const pendingRetry = new Promise((resolve) => { resolveRetry = resolve; });
    (fetch as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(pendingRetry)
      .mockResolvedValueOnce({ json: async () => ({ emails: [] }) });

    act(() => {
      result.current.retry('email-1');
    });

    await waitFor(() => expect(result.current.retryingId).toBe('email-1'));

    await act(async () => {
      resolveRetry({ json: async () => ({ success: true }) });
      await pendingRetry;
    });

    await waitFor(() => expect(result.current.retryingId).toBeNull());
  });
});
