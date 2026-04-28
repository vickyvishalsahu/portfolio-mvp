import YahooFinance from 'yahoo-finance2';
import type { RawPrice } from '../types';

const yahooFinance = new YahooFinance();

export const fetchYahooPrice = async (ticker: string): Promise<RawPrice | null> => {
  try {
    const quote = await yahooFinance.quote(ticker);
    if (quote?.regularMarketPrice && quote?.currency) {
      return { price: quote.regularMarketPrice, currency: quote.currency };
    }
    return null;
  } catch (error) {
    console.error(`Yahoo Finance error for ${ticker}:`, error);
    return null;
  }
};
