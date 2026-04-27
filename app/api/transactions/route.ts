import { insertTransaction } from '@/domains/shared/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { asset_type, ticker, name, quantity, price, currency, transaction_type, transaction_date, broker } = body;

    if (!asset_type || !name || !currency || !transaction_type || !transaction_date || !broker) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!quantity || Number(quantity) <= 0) {
      return Response.json({ error: 'quantity must be greater than 0' }, { status: 400 });
    }

    if (!price || Number(price) <= 0) {
      return Response.json({ error: 'price must be greater than 0' }, { status: 400 });
    }

    insertTransaction({
      email_id: 'manual',
      asset_type,
      ticker: ticker || null,
      name,
      quantity: Number(quantity),
      price: Number(price),
      currency,
      transaction_type,
      transaction_date,
      broker,
      raw_text: '',
      confidence: 'high',
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
