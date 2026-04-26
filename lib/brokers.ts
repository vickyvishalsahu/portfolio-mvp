export interface BrokerDefinition {
  id: string;
  name: string;
  senderDomains: string[];       // used by parser pre-filter (precise)
  gmailSearchTerms?: string[];   // used in Gmail query (can be broader). Defaults to senderDomains.
  subjectKeywords?: string[];
  assetTypes: Array<'stock' | 'etf' | 'mf' | 'crypto'>;
  region: 'EU' | 'IN' | 'US' | 'GLOBAL';
}

export const GLOBAL_SUBJECT_KEYWORDS = [
  'confirmation',
  'contract note',
  'purchase',
  'SIP',
  'bought',
  'sold',
  'order',
  'execution',
  'transaction',
  'allotment',
  'redemption',
];

export const BROKER_CATALOG: BrokerDefinition[] = [
  {
    id: 'scalable',
    name: 'Scalable Capital',
    senderDomains: ['scalable.capital'],
    assetTypes: ['stock', 'etf', 'crypto'],
    region: 'EU',
  },
  {
    id: 'zerodha',
    name: 'Zerodha',
    // senderDomains: precise list for parser pre-filter
    senderDomains: ['zerodha.com', 'kite.zerodha.com', 'zerodha.net'],
    // gmailSearchTerms: zerodha.com catches *.zerodha.com subdomains (substring match);
    // zerodha.net catches reportsmailer/mailer/alertsmailer etc. (confirmed from support.zerodha.com)
    gmailSearchTerms: ['zerodha.com', 'zerodha.net'],
    assetTypes: ['stock', 'etf', 'mf'],
    region: 'IN',
  },
  {
    id: 'cams',
    name: 'CAMS',
    senderDomains: ['camsonline.com', 'cams.in'],
    assetTypes: ['mf'],
    region: 'IN',
  },
  {
    id: 'groww',
    name: 'Groww',
    senderDomains: ['groww.in'],
    assetTypes: ['stock', 'mf', 'etf'],
    region: 'IN',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    senderDomains: ['coinbase.com'],
    assetTypes: ['crypto'],
    region: 'GLOBAL',
  },
  {
    id: 'binance',
    name: 'Binance',
    senderDomains: ['binance.com'],
    assetTypes: ['crypto'],
    region: 'GLOBAL',
  },
  {
    id: 'paytmmoney',
    name: 'Paytm Money',
    senderDomains: ['paytmmoney.com'],
    assetTypes: ['stock', 'mf', 'etf'],
    region: 'IN',
  },
  {
    // Rebranded from Angel Broking to Angel One in 2021
    id: 'angelone',
    name: 'Angel One',
    senderDomains: ['angelone.in', 'angelbroking.com'],
    gmailSearchTerms: ['angelone.in', 'angelbroking.com'],
    assetTypes: ['stock', 'etf'],
    region: 'IN',
  },
  {
    id: 'upstox',
    name: 'Upstox',
    senderDomains: ['upstox.com'],
    assetTypes: ['stock', 'etf', 'mf'],
    region: 'IN',
  },
];

export function getBrokersByIds(ids: string[]): BrokerDefinition[] {
  return ids
    .map((id) => BROKER_CATALOG.find((b) => b.id === id))
    .filter((b): b is BrokerDefinition => b !== undefined);
}

export function getAllSenderDomains(brokers: BrokerDefinition[]): string[] {
  return brokers.flatMap((b) => b.senderDomains);
}

export function getGmailSearchTerms(brokers: BrokerDefinition[]): string[] {
  return brokers.flatMap((b) => b.gmailSearchTerms ?? b.senderDomains);
}

export function getAllSubjectKeywords(brokers: BrokerDefinition[]): string[] {
  const brokerKeywords = brokers.flatMap((b) => b.subjectKeywords ?? []);
  return [...new Set([...GLOBAL_SUBJECT_KEYWORDS, ...brokerKeywords])];
}
