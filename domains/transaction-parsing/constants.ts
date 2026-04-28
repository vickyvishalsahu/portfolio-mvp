export type TransactionKeyword =
  | 'order'
  | 'confirmation'
  | 'confirmed'
  | 'executed'
  | 'purchase'
  | 'bought'
  | 'sold'
  | 'sell'
  | 'buy'
  | 'sip'
  | 'dividend'
  | 'trade'
  | 'allotment'
  | 'redemption'
  | 'switch'
  | 'transaction'
  | 'investment'
  | 'demat';

export const TRANSACTION_KEYWORDS: readonly TransactionKeyword[] = [
  'order', 'confirmation', 'confirmed', 'executed', 'purchase', 'bought',
  'sold', 'sell', 'buy', 'sip', 'dividend', 'trade', 'allotment',
  'redemption', 'switch', 'transaction', 'investment', 'demat',
];

import type { AssetType, TransactionType, Currency } from '@/domains/shared/types';

export const VALID_ASSET_TYPES: readonly AssetType[] = ['stock', 'etf', 'mf', 'crypto'];
export const VALID_TRANSACTION_TYPES: readonly TransactionType[] = ['buy', 'sell', 'dividend', 'sip'];
export const VALID_CURRENCIES: readonly Currency[] = ['EUR', 'INR', 'USD'];
