// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePriceRefresh } from './usePriceRefresh';

describe('usePriceRefresh', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts idle with no failed tickers', () => {
    const { result } = renderHook(() => usePriceRefresh());
    expect(result.current.refreshing).toBe(false);
    expect(result.current.failedTickers).toEqual([]);
  });

  it('sets refreshing true while the request is in flight, then false once it resolves', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => { resolveFetch = resolve; });
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(pending);

    const { result } = renderHook(() => usePriceRefresh());
    const onComplete = vi.fn();

    act(() => {
      result.current.refreshPrices(onComplete);
    });

    await waitFor(() => expect(result.current.refreshing).toBe(true));

    await act(async () => {
      resolveFetch({ json: async () => ({ updated: 3, failed: [] }) });
      await pending;
    });

    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('populates failedTickers from the response and resets them on the next call', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ updated: 1, failed: ['AAPL', 'TSLA'] }),
    });

    const { result } = renderHook(() => usePriceRefresh());

    await act(async () => {
      await result.current.refreshPrices(vi.fn());
    });

    expect(result.current.failedTickers).toEqual(['AAPL', 'TSLA']);

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ updated: 2, failed: [] }),
    });

    await act(async () => {
      await result.current.refreshPrices(vi.fn());
    });

    expect(result.current.failedTickers).toEqual([]);
  });

  it('calls onComplete after a successful refresh', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: async () => ({ updated: 1, failed: [] }),
    });

    const { result } = renderHook(() => usePriceRefresh());
    const onComplete = vi.fn();

    await act(async () => {
      await result.current.refreshPrices(onComplete);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('leaves refreshing false and swallows the error on network failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => usePriceRefresh());
    const onComplete = vi.fn();

    await act(async () => {
      await result.current.refreshPrices(onComplete);
    });

    expect(result.current.refreshing).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
