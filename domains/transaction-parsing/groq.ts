import Groq from 'groq-sdk';
import type { ParseResponse, ParsedTransaction } from '@/domains/shared/types';
import type { EmailParser } from './types';

const SYSTEM_PROMPT = `You are a financial transaction parser.
Extract investment transaction data from broker confirmation emails.

Return ONLY valid JSON in this exact shape:
{
  "transactions": [
    {
      "asset_type": "stock" | "etf" | "mf" | "crypto",
      "ticker": string | null,
      "name": string,
      "quantity": number,
      "price": number,
      "currency": "EUR" | "INR" | "USD",
      "transaction_type": "buy" | "sell" | "dividend" | "sip",
      "transaction_date": "YYYY-MM-DD",
      "broker": string,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "unparseable": boolean,
  "reason": string | null
}

Rules:
- If ticker is not in the email, set it to null and use name
- For Indian mutual funds, use ISIN as ticker if present
- For European ETFs/stocks on Scalable Capital, use the ISIN or exchange ticker (e.g. "VWCE.DE")
- For Indian stocks on Zerodha, use NSE ticker (e.g. "HDFCBANK")
- confidence = "low" if you had to guess any field
- unparseable = true if this is not a transaction email (e.g. marketing, account alerts)
- price should be the per-unit price, not total amount
- quantity should be positive for both buys and sells
- broker should be lowercase: "scalable", "zerodha", "cams", "coinbase", "binance", etc.`;

const validateResponse = (parsed: ParseResponse): ParseResponse => {
  if (parsed.unparseable) return parsed;

  const validTypes = ['stock', 'etf', 'mf', 'crypto'];
  const validTxTypes = ['buy', 'sell', 'dividend', 'sip'];
  const validCurrencies = ['EUR', 'INR', 'USD'];

  parsed.transactions = parsed.transactions.filter((tx: ParsedTransaction) => {
    if (!validTypes.includes(tx.asset_type)) return false;
    if (!validTxTypes.includes(tx.transaction_type)) return false;
    if (!validCurrencies.includes(tx.currency)) return false;
    if (!tx.name || tx.quantity <= 0 || tx.price <= 0) return false;
    if (!tx.transaction_date?.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    return true;
  });

  return parsed;
};

export class GroqParser implements EmailParser {
  private client: Groq;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async parse(emailBody: string, sender: string, subject: string): Promise<ParseResponse> {
    const userMessage = `Parse this broker email:

From: ${sender}
Subject: ${subject}

Body:
${emailBody}`;

    const response = await this.client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
    });

    const text = response.choices[0].message.content ?? '';

    try {
      const parsed: ParseResponse = JSON.parse(text);
      return validateResponse(parsed);
    } catch {
      return {
        transactions: [],
        unparseable: true,
        reason: `Failed to parse response: ${text.substring(0, 200)}`,
      };
    }
  }
}
