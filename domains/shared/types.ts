export type AssetType = 'stock' | 'etf' | 'mf' | 'crypto';
export type TransactionType = 'buy' | 'sell' | 'dividend' | 'sip';
export type Currency = 'EUR' | 'INR' | 'USD';
export type Confidence = 'high' | 'medium' | 'low';
export type Region = 'EU' | 'IN' | 'US' | 'GLOBAL';

export interface BrokerDefinition {
  id: string;
  name: string;
  senderDomains: string[];
  gmailSearchTerms?: string[];
  subjectKeywords?: string[];
  assetTypes: AssetType[];
  region: Region;
}

export interface RawEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  received_at: string;
  parsed: number;
}

export interface Transaction {
  id?: number;
  email_id: string;
  asset_type: AssetType;
  ticker: string | null;
  name: string;
  quantity: number;
  price: number;
  currency: Currency;
  transaction_type: TransactionType;
  transaction_date: string;
  broker: string;
  raw_text: string;
  confidence: Confidence;
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
  avg_cost_local: number;
  current_price_eur: number;
  current_price_local: number;
  current_value_eur: number;
  current_value_local: number;
  prev_value_eur: number | null;
  prev_value_local: number | null;
  pnl: number;
  pnl_local: number;
  pnl_pct: number;
  currency: string;
  broker: string;
}

export interface ParsedTransaction {
  asset_type: AssetType;
  ticker: string | null;
  name: string;
  quantity: number;
  price: number;
  currency: Currency;
  transaction_type: TransactionType;
  transaction_date: string;
  broker: string;
  confidence: Confidence;
}

export interface ParseResponse {
  transactions: ParsedTransaction[];
  unparseable: boolean;
  reason: string | null;
}
