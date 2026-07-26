export type RawPrice = {
  price: number;
  currency: string;
};

export type HistoricalPrice = {
  date: string;
  price: number;
  currency: string;
};

export type PriceResult = {
  priceEur: number;
  priceLocal: number;
  currency: string;
};
