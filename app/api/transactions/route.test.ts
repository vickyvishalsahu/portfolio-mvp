import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/domains/shared/db', () => ({
  insertTransaction: vi.fn().mockReturnValue({ lastInsertRowid: 1 }),
}));

import { POST } from './route';
import { insertTransaction } from '@/domains/shared/db';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  asset_type: 'stock',
  ticker: 'AAPL',
  name: 'Apple Inc',
  quantity: 10,
  price: 150,
  currency: 'EUR',
  transaction_type: 'buy',
  transaction_date: '2026-04-26',
  broker: 'scalable',
};

describe('POST /api/transactions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 and calls insertTransaction on valid data', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
    expect(insertTransaction).toHaveBeenCalledOnce();
  });

  it('passes email_id as "manual" for manually entered transactions', async () => {
    await POST(makeRequest(validBody));
    expect(insertTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ email_id: 'manual' })
    );
  });

  it('returns 400 if name is missing', async () => {
    const { name: _, ...body } = validBody;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
  });

  it('returns 400 if broker is missing', async () => {
    const { broker: _, ...body } = validBody;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
  });

  it('returns 400 if quantity is zero', async () => {
    const res = await POST(makeRequest({ ...validBody, quantity: 0 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 if quantity is negative', async () => {
    const res = await POST(makeRequest({ ...validBody, quantity: -5 }));
    expect(res.status).toBe(400);
  });

  it('returns 400 if price is zero', async () => {
    const res = await POST(makeRequest({ ...validBody, price: 0 }));
    expect(res.status).toBe(400);
  });

  it('ticker is optional — null when omitted', async () => {
    const { ticker: _, ...body } = validBody;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(201);
    expect(insertTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ ticker: null })
    );
  });
});
