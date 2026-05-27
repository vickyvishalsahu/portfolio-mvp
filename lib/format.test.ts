import { describe, it, expect } from 'vitest';
import { formatEur, formatLocal, formatHolding, formatPercent } from './format';

describe('formatEur', () => {
  it('produces the same output as the canonical Intl formatter', () => {
    const canonical = new Intl.NumberFormat('en-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.56);
    expect(formatEur(1234.56)).toBe(canonical);
  });

  it('always contains the EUR currency marker', () => {
    expect(formatEur(0)).toMatch(/€|EUR/);
    expect(formatEur(9999)).toMatch(/€|EUR/);
  });

  it('formats to exactly 2 decimal places', () => {
    expect(formatEur(100)).toMatch(/[.,]00/);
  });
});

describe('formatLocal — INR', () => {
  it('formats crores for values ≥ 1 Cr (10,000,000)', () => {
    expect(formatLocal(10_000_000, 'INR')).toBe('₹1.00Cr');
    expect(formatLocal(15_000_000, 'INR')).toBe('₹1.50Cr');
  });

  it('formats lakhs for values ≥ 1L (100,000) and < 1Cr', () => {
    expect(formatLocal(100_000, 'INR')).toBe('₹1.0L');
    expect(formatLocal(150_000, 'INR')).toBe('₹1.5L');
    expect(formatLocal(9_999_999, 'INR')).toBe('₹100.0L');
  });

  it('formats small values as plain ₹ with comma grouping', () => {
    expect(formatLocal(99, 'INR')).toBe('₹99');
    expect(formatLocal(1_500, 'INR')).toBe('₹1,500');
  });

  it('rounds sub-rupee amounts', () => {
    expect(formatLocal(99.75, 'INR')).toBe('₹100');
    expect(formatLocal(99.4, 'INR')).toBe('₹99');
  });

  it('never shows EUR symbol for INR', () => {
    expect(formatLocal(500_000, 'INR')).not.toMatch(/€|EUR/);
  });
});

describe('formatHolding', () => {
  it('returns EUR format when currency is EUR', () => {
    const result = formatHolding(100, 100, 'EUR');
    expect(result).toMatch(/€|EUR/);
    expect(result).not.toContain('₹');
  });

  it('returns local format when currency is INR — never shows €', () => {
    const result = formatHolding(15_000, 165, 'INR');
    expect(result).toContain('₹');
    expect(result).not.toMatch(/€|EUR/);
  });

  it('uses localAmount for INR, not eurAmount', () => {
    // localAmount=15000 → ₹15,000; eurAmount=165 → would show ~€165
    expect(formatHolding(15_000, 165, 'INR')).toBe('₹15,000');
  });

  it('uses eurAmount for EUR, not localAmount', () => {
    // same inputs, only currency differs
    const eurResult = formatHolding(15_000, 165, 'EUR');
    expect(eurResult).toBe(formatEur(165));
  });
});

describe('formatPercent', () => {
  it('prefixes positive values with +', () => {
    expect(formatPercent(3.45)).toBe('+3.45%');
  });

  it('does not double-sign negative values', () => {
    expect(formatPercent(-3.45)).toBe('-3.45%');
  });

  it('treats zero as positive', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('always formats to 2 decimal places', () => {
    expect(formatPercent(1)).toBe('+1.00%');
    expect(formatPercent(-0.1)).toBe('-0.10%');
  });
});
