export interface RawEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  received_at: string;
  parsed: number; // 0 = pending, 1 = done
}

export interface Transaction {
  id?: number;
  email_id: string;
  asset_type: 'stock' | 'etf' | 'mf' | 'crypto';
  ticker: string | null;
  name: string;
  quantity: number;
  price: number;
  currency: 'EUR' | 'INR' | 'USD';
  transaction_type: 'buy' | 'sell' | 'dividend' | 'sip';
  transaction_date: string;
  broker: string;
  raw_text: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PriceCache {
  ticker: string;
  price_eur: number;
  price_local: number;
  currency: string;
  updated_at: string;
}

export interface Holding {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  avg_cost_eur: number;
  current_price_eur: number;
  current_value_eur: number;
  pnl: number;
  pnl_pct: number;
  currency: string;
  broker: string;
}

export interface ParsedTransaction {
  asset_type: 'stock' | 'etf' | 'mf' | 'crypto';
  ticker: string | null;
  name: string;
  quantity: number;
  price: number;
  currency: 'EUR' | 'INR' | 'USD';
  transaction_type: 'buy' | 'sell' | 'dividend' | 'sip';
  transaction_date: string;
  broker: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ClaudeParseResponse {
  transactions: ParsedTransaction[];
  unparseable: boolean;
  reason: string | null;
}
