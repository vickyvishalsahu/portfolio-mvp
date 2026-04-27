import { describe, it, expect } from 'vitest';
import { fmtEur, fmtLocal, fmtHolding, pct } from './format';

describe('fmtEur', () => {
  it('produces the same output as the canonical Intl formatter', () => {
    const canonical = new Intl.NumberFormat('en-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.56);
    expect(fmtEur(1234.56)).toBe(canonical);
  });

  it('always contains the EUR currency marker', () => {
    expect(fmtEur(0)).toMatch(/€|EUR/);
    expect(fmtEur(9999)).toMatch(/€|EUR/);
  });

  it('formats to exactly 2 decimal places', () => {
    expect(fmtEur(100)).toMatch(/[.,]00/);
  });
});

describe('fmtLocal — INR', () => {
  it('formats crores for values ≥ 1 Cr (10,000,000)', () => {
    expect(fmtLocal(10_000_000, 'INR')).toBe('₹1.00Cr');
    expect(fmtLocal(15_000_000, 'INR')).toBe('₹1.50Cr');
  });

  it('formats lakhs for values ≥ 1L (100,000) and < 1Cr', () => {
    expect(fmtLocal(100_000, 'INR')).toBe('₹1.0L');
    expect(fmtLocal(150_000, 'INR')).toBe('₹1.5L');
    expect(fmtLocal(9_999_999, 'INR')).toBe('₹100.0L');
  });

  it('formats small values as plain ₹ with comma grouping', () => {
    expect(fmtLocal(99, 'INR')).toBe('₹99');
    expect(fmtLocal(1_500, 'INR')).toBe('₹1,500');
  });

  it('rounds sub-rupee amounts', () => {
    expect(fmtLocal(99.75, 'INR')).toBe('₹100');
    expect(fmtLocal(99.4, 'INR')).toBe('₹99');
  });

  it('never shows EUR symbol for INR', () => {
    expect(fmtLocal(500_000, 'INR')).not.toMatch(/€|EUR/);
  });
});

describe('fmtHolding', () => {
  it('returns EUR format when currency is EUR', () => {
    const result = fmtHolding(100, 100, 'EUR');
    expect(result).toMatch(/€|EUR/);
    expect(result).not.toContain('₹');
  });

  it('returns local format when currency is INR — never shows €', () => {
    const result = fmtHolding(15_000, 165, 'INR');
    expect(result).toContain('₹');
    expect(result).not.toMatch(/€|EUR/);
  });

  it('uses localAmount for INR, not eurAmount', () => {
    // localAmount=15000 → ₹15,000; eurAmount=165 → would show ~€165
    expect(fmtHolding(15_000, 165, 'INR')).toBe('₹15,000');
  });

  it('uses eurAmount for EUR, not localAmount', () => {
    // same inputs, only currency differs
    const eurResult = fmtHolding(15_000, 165, 'EUR');
    expect(eurResult).toBe(fmtEur(165));
  });
});

describe('pct', () => {
  it('prefixes positive values with +', () => {
    expect(pct(3.45)).toBe('+3.45%');
  });

  it('does not double-sign negative values', () => {
    expect(pct(-3.45)).toBe('-3.45%');
  });

  it('treats zero as positive', () => {
    expect(pct(0)).toBe('+0.00%');
  });

  it('always formats to 2 decimal places', () => {
    expect(pct(1)).toBe('+1.00%');
    expect(pct(-0.1)).toBe('-0.10%');
  });
});
