export type AssetType = 'stock' | 'etf' | 'mf' | 'crypto';
export type Institution = { name: string; domain: string };
export type TransactionType = 'buy' | 'sell' | 'dividend' | 'sip';
export type Currency = 'EUR' | 'INR' | 'USD';
export type Confidence = 'high' | 'medium' | 'low';
export type Region = 'EU' | 'IN' | 'US' | 'GLOBAL';

export interface BrokerDefinition {
  id: string;
  name: string;
  senderDomains: string[];
  gmailSearchTerms?: string[];
  assetTypes: AssetType[];
  region: Region;
}

export interface RawEmail {
  id: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  parsed: number;
}

export interface Transaction {
  id?: number;
  emailId: string;
  assetType: AssetType;
  ticker: string | null;
  name: string;
  quantity: number;
  price: number;
  currency: Currency;
  transactionType: TransactionType;
  transactionDate: string;
  broker: string;
  rawText: string;
  confidence: Confidence;
}

export interface PriceCache {
  ticker: string;
  priceEur: number;
  priceLocal: number;
  currency: string;
  updatedAt: string;
}

export interface Holding {
  ticker: string;
  name: string;
  assetType: string;
  quantity: number;
  avgCostEur: number;
  avgCostLocal: number;
  currentPriceEur: number;
  currentPriceLocal: number;
  currentValueEur: number;
  currentValueLocal: number;
  prevValueEur: number | null;
  prevValueLocal: number | null;
  pnl: number;
  pnlLocal: number;
  pnlPct: number;
  currency: string;
  broker: string;
}

export interface ParsedTransaction {
  assetType: AssetType;
  ticker: string | null;
  name: string;
  quantity: number;
  price: number;
  currency: Currency;
  transactionType: TransactionType;
  transactionDate: string;
  broker: string;
  confidence: Confidence;
}

export interface ParseResponse {
  transactions: ParsedTransaction[];
  unparseable: boolean;
  reason: string | null;
}
