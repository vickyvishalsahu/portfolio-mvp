import { insertTransaction } from '@/domains/shared/db';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const { assetType, ticker, name, quantity, price, currency, transactionType, transactionDate, broker } = body;

    if (!assetType || !name || !currency || !transactionType || !transactionDate || !broker) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!quantity || Number(quantity) <= 0) {
      return Response.json({ error: 'quantity must be greater than 0' }, { status: 400 });
    }

    if (!price || Number(price) <= 0) {
      return Response.json({ error: 'price must be greater than 0' }, { status: 400 });
    }

    insertTransaction({
      emailId: 'manual',
      assetType,
      ticker: ticker || null,
      name,
      quantity: Number(quantity),
      price: Number(price),
      currency,
      transactionType,
      transactionDate,
      broker,
      rawText: '',
      confidence: 'high',
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
