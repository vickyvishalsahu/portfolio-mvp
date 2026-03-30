import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeParseResponse, ParsedTransaction } from '@/types';

const client = new Anthropic();

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
- broker should be lowercase: "scalable", "zerodha", "cams", "coinbase", "binance", etc.
- Do NOT wrap the JSON in markdown code blocks`;

export async function parseEmail(
  emailBody: string,
  sender: string,
  subject: string
): Promise<ClaudeParseResponse> {
  const userMessage = `Parse this broker email:

From: ${sender}
Subject: ${subject}

Body:
${emailBody}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '').trim();

  try {
    const parsed: ClaudeParseResponse = JSON.parse(cleaned);
    return validateResponse(parsed);
  } catch {
    return {
      transactions: [],
      unparseable: true,
      reason: `Failed to parse Claude response: ${text.substring(0, 200)}`,
    };
  }
}

function validateResponse(parsed: ClaudeParseResponse): ClaudeParseResponse {
  if (parsed.unparseable) return parsed;

  const validTypes = ['stock', 'etf', 'mf', 'crypto'];
  const validTxTypes = ['buy', 'sell', 'dividend', 'sip'];
  const validCurrencies = ['EUR', 'INR', 'USD'];

  parsed.transactions = parsed.transactions.filter((tx) => {
    if (!validTypes.includes(tx.asset_type)) return false;
    if (!validTxTypes.includes(tx.transaction_type)) return false;
    if (!validCurrencies.includes(tx.currency)) return false;
    if (!tx.name || tx.quantity <= 0 || tx.price <= 0) return false;
    if (!tx.transaction_date?.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    return true;
  });

  return parsed;
}
