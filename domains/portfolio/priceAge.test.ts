import { describe, it, expect, vi } from "vitest";
import { formatPriceAge } from "./priceAge";

describe("formatPriceAge", () => {
  const makeTranslate = () =>
    vi.fn((key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key
    );

  it("returns the never key when updatedAt is null", () => {
    const t = makeTranslate();
    expect(formatPriceAge(null, t, "holdings.priceAge")).toBe(
      "holdings.priceAge.never",
    );
  });

  it("returns justNow for under a minute", () => {
    const t = makeTranslate();
    const updatedAt = new Date(Date.now() - 30_000).toISOString();
    expect(formatPriceAge(updatedAt, t, "holdings.priceAge")).toBe(
      "holdings.priceAge.justNow",
    );
  });

  it("returns oneMinAgo for exactly one minute", () => {
    const t = makeTranslate();
    const updatedAt = new Date(Date.now() - 60_000).toISOString();
    expect(formatPriceAge(updatedAt, t, "holdings.priceAge")).toBe(
      "holdings.priceAge.oneMinAgo",
    );
  });

  it("returns minsAgo with the minute count for under an hour", () => {
    const t = makeTranslate();
    const updatedAt = new Date(Date.now() - 45 * 60_000).toISOString();
    expect(formatPriceAge(updatedAt, t, "holdings.priceAge")).toBe(
      'holdings.priceAge.minsAgo:{"mins":45}',
    );
  });

  it("returns oneHourAgo for exactly one hour", () => {
    const t = makeTranslate();
    const updatedAt = new Date(Date.now() - 60 * 60_000).toISOString();
    expect(formatPriceAge(updatedAt, t, "holdings.priceAge")).toBe(
      "holdings.priceAge.oneHourAgo",
    );
  });

  it("returns hoursAgo with the hour count beyond an hour", () => {
    const t = makeTranslate();
    const updatedAt = new Date(Date.now() - 125 * 60_000).toISOString();
    expect(formatPriceAge(updatedAt, t, "holdings.priceAge")).toBe(
      'holdings.priceAge.hoursAgo:{"hrs":2}',
    );
  });

  it("uses the dashboard key prefix when passed", () => {
    const t = makeTranslate();
    expect(formatPriceAge(null, t, "dashboard.priceAge")).toBe(
      "dashboard.priceAge.never",
    );
  });
});
