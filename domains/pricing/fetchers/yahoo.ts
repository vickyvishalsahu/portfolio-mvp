import YahooFinance from 'yahoo-finance2';
import type { RawPrice, HistoricalPrice } from '../types';

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

type ChartQuote = {
  date: Date;
  close: number | null;
};

export const fetchYahooPriceHistory = async (ticker: string, fromDate: string): Promise<HistoricalPrice[] | null> => {
  try {
    const chart = await yahooFinance.chart(ticker, { period1: fromDate, interval: '1d' });
    const currency = chart?.meta?.currency;
    if (!currency) return null;

    const quotes = (chart?.quotes ?? []) as ChartQuote[];
    const history = quotes
      .filter((quote) => quote.close !== null && quote.close !== undefined)
      .map((quote) => ({
        date: new Date(quote.date).toISOString().slice(0, 10),
        price: quote.close!,
        currency,
      }));

    return history.length > 0 ? history : null;
  } catch (error) {
    console.error(`Yahoo Finance history error for ${ticker}:`, error);
    return null;
  }
};
