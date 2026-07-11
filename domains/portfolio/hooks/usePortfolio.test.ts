// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePortfolio } from './usePortfolio';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const PORTFOLIO_RESPONSE = {
  summary: { byCurrency: [{ currency: 'EUR', totalValue: 100, totalPnl: 10, totalPnlPct: 10 }], holdingsCount: 1, transactionCount: 1 },
  holdings: [],
  brokerAllocation: {},
  orphanedSells: [],
  priceCacheUpdatedAt: '2026-07-11T10:00:00.000Z',
};

const jsonResponse = (body: unknown) => ({ json: async () => body });

describe('usePortfolio', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in a loading state', () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse(PORTFOLIO_RESPONSE));
    const { result } = renderHook(() => usePortfolio());
    expect(result.current.loading).toBe(true);
  });

  it('fetches portfolio data and priceAge on mount', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.startsWith('/api/portfolio')) return Promise.resolve(jsonResponse(PORTFOLIO_RESPONSE));
      return Promise.resolve(jsonResponse([]));
    });

    const { result } = renderHook(() => usePortfolio());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data?.summary.holdingsCount).toBe(1);
    expect(result.current.priceAge).toBe('2026-07-11T10:00:00.000Z');
  });

  it('leaves data null when the response has no summary', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));

    const { result } = renderHook(() => usePortfolio());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it('fetches snapshots for the primary currency once portfolio data resolves', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.startsWith('/api/portfolio')) return Promise.resolve(jsonResponse(PORTFOLIO_RESPONSE));
      if (url.startsWith('/api/snapshots')) return Promise.resolve(jsonResponse([{ date: '2026-07-01', totalValue: 90 }]));
      return Promise.resolve(jsonResponse([]));
    });

    const { result } = renderHook(() => usePortfolio());

    await waitFor(() => expect(result.current.snapshots).toHaveLength(1));
    expect(fetch).toHaveBeenCalledWith('/api/snapshots?currency=EUR');
  });

  it('refreshes prices then refetches the portfolio, updating priceAge', async () => {
    let portfolioCallCount = 0;
    (fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/prices' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse({ updated: 1, failed: [] }));
      }
      if (url.startsWith('/api/portfolio')) {
        portfolioCallCount += 1;
        const updatedAt = portfolioCallCount === 1 ? '2026-07-11T09:00:00.000Z' : '2026-07-11T10:30:00.000Z';
        return Promise.resolve(jsonResponse({ ...PORTFOLIO_RESPONSE, priceCacheUpdatedAt: updatedAt }));
      }
      return Promise.resolve(jsonResponse([]));
    });

    const { result } = renderHook(() => usePortfolio());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.priceAge).toBe('2026-07-11T09:00:00.000Z');

    await act(async () => {
      await result.current.handleRefreshPrices();
    });

    expect(result.current.priceAge).toBe('2026-07-11T10:30:00.000Z');
    expect(result.current.refreshing).toBe(false);
  });

  it('formats priceAge under the dashboard key prefix', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse(PORTFOLIO_RESPONSE));
    const { result } = renderHook(() => usePortfolio());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.formatAge(null)).toBe('dashboard.priceAge.never');
  });
});
