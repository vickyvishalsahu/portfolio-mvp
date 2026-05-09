import { describe, it, expect } from 'vitest';
import { computeNetWorthDelta } from './snapshot-delta';

const makeSnapshots = (startDate: string, count: number, startValue: number, dailyGain: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(new Date(startDate).getTime() + index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return { date, totalValue: startValue + index * dailyGain };
  });

describe('computeNetWorthDelta', () => {
  it('returns null for empty array', () => {
    expect(computeNetWorthDelta([])).toBeNull();
  });

  it('returns null for a single snapshot', () => {
    expect(computeNetWorthDelta([{ date: '2026-04-01', totalValue: 1000 }])).toBeNull();
  });

  it('returns null when history is less than 7 days', () => {
    const snapshots = [
      { date: '2026-04-27', totalValue: 1000 },
      { date: '2026-05-01', totalValue: 1100 },
    ];
    expect(computeNetWorthDelta(snapshots)).toBeNull();
  });

  it('returns null when history is exactly 6 days', () => {
    const snapshots = makeSnapshots('2026-04-25', 7, 1000, 10); // day 0 to day 6 = 6 days
    expect(computeNetWorthDelta(snapshots)).toBeNull();
  });

  it('returns a result when history is exactly 7 days', () => {
    const snapshots = makeSnapshots('2026-04-24', 8, 1000, 10); // 7 days between first and last
    expect(computeNetWorthDelta(snapshots)).not.toBeNull();
  });

  it('uses the snapshot closest to 30 days ago as reference', () => {
    const snapshots = [
      { date: '2026-03-01', totalValue: 800 },
      { date: '2026-04-01', totalValue: 1000 }, // exactly 30 days before 2026-05-01
      { date: '2026-05-01', totalValue: 1300 },
    ];
    const result = computeNetWorthDelta(snapshots);
    expect(result).not.toBeNull();
    expect(result!.delta).toBe(300);
    expect(result!.deltaPct).toBeCloseTo(30, 1);
  });

  it('picks the closer snapshot when reference is not exact', () => {
    const snapshots = [
      { date: '2026-03-28', totalValue: 950 }, // 34 days before latest — 4 days from 30-day mark
      { date: '2026-04-03', totalValue: 1000 }, // 28 days before latest — 2 days from 30-day mark
      { date: '2026-05-01', totalValue: 1200 },
    ];
    const result = computeNetWorthDelta(snapshots);
    expect(result).not.toBeNull();
    expect(result!.delta).toBe(200); // 1200 - 1000 (reference is 2026-04-03)
  });

  it('computes a negative delta when portfolio declined', () => {
    const snapshots = [
      { date: '2026-03-01', totalValue: 2000 },
      { date: '2026-04-01', totalValue: 1800 }, // 30-day reference
      { date: '2026-05-01', totalValue: 1500 },
    ];
    const result = computeNetWorthDelta(snapshots);
    expect(result).not.toBeNull();
    expect(result!.delta).toBe(-300);
    expect(result!.deltaPct).toBeCloseTo(-16.67, 1);
  });

  it('uses the latest snapshot as the current value, not an earlier one', () => {
    const snapshots = makeSnapshots('2026-03-01', 62, 1000, 10); // 61 days of data
    const result = computeNetWorthDelta(snapshots);
    expect(result).not.toBeNull();
    const latest = snapshots[snapshots.length - 1];
    expect(result!.delta).toBe(latest.totalValue - (1000 + 31 * 10)); // reference is ~30 days back
  });

  it('returns delta of zero when value is unchanged', () => {
    const snapshots = [
      { date: '2026-04-01', totalValue: 1000 },
      { date: '2026-05-01', totalValue: 1000 },
    ];
    const result = computeNetWorthDelta(snapshots);
    expect(result).not.toBeNull();
    expect(result!.delta).toBe(0);
    expect(result!.deltaPct).toBe(0);
  });
});
