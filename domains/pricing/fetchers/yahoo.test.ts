import { vi, describe, it, expect, beforeEach } from 'vitest';

const chartMock = vi.hoisted(() => vi.fn());

vi.mock('yahoo-finance2', () => ({
  default: class {
    quote = vi.fn();
    chart = chartMock;
  },
}));

import { fetchYahooPriceHistory } from './yahoo';

describe('fetchYahooPriceHistory', () => {
  beforeEach(() => {
    chartMock.mockReset();
  });

  it('maps chart quotes to ISO-dated rows in the instrument currency', async () => {
    chartMock.mockResolvedValue({
      meta: { currency: 'INR' },
      quotes: [
        { date: new Date('2026-07-24T00:00:00Z'), close: 2890 },
        { date: new Date('2026-07-25T00:00:00Z'), close: 2905.5 },
      ],
    });

    const history = await fetchYahooPriceHistory('RELIANCE.NS', '2026-07-01');

    expect(history).toEqual([
      { date: '2026-07-24', price: 2890, currency: 'INR' },
      { date: '2026-07-25', price: 2905.5, currency: 'INR' },
    ]);
    expect(chartMock).toHaveBeenCalledWith('RELIANCE.NS', { period1: '2026-07-01', interval: '1d' });
  });

  it('filters out holiday rows with null closes', async () => {
    chartMock.mockResolvedValue({
      meta: { currency: 'EUR' },
      quotes: [
        { date: new Date('2026-07-24T00:00:00Z'), close: 101 },
        { date: new Date('2026-07-25T00:00:00Z'), close: null },
      ],
    });

    const history = await fetchYahooPriceHistory('IWDA.AS', '2026-07-01');

    expect(history).toHaveLength(1);
    expect(history![0].price).toBe(101);
  });

  it('returns null when the chart call throws', async () => {
    chartMock.mockRejectedValue(new Error('not found'));

    expect(await fetchYahooPriceHistory('BOGUS', '2026-07-01')).toBeNull();
  });

  it('returns null when there are no usable quotes', async () => {
    chartMock.mockResolvedValue({ meta: { currency: 'EUR' }, quotes: [] });

    expect(await fetchYahooPriceHistory('IWDA.AS', '2026-07-01')).toBeNull();
  });
});
