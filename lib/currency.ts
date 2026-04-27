type RateCache = {
  rates: Record<string, number>;
  updated_at: number;
}

let rateCache: RateCache | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const getExchangeRates = async (): Promise<Record<string, number>> => {
  if (rateCache && Date.now() - rateCache.updated_at < CACHE_TTL) {
    return rateCache.rates;
  }

  try {
    // Free API, no key required for EUR base
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    const data = await res.json();

    const rates: Record<string, number> = {
      EUR: 1,
      USD: data.rates.USD,
      INR: data.rates.INR,
    };

    rateCache = { rates, updated_at: Date.now() };
    return rates;
  } catch (error) {
    console.error('Exchange rate fetch failed:', error);
    // Fallback rates
    return { EUR: 1, USD: 1.08, INR: 90.5 };
  }
};

export const convertToEur = async (amount: number, fromCurrency: string): Promise<number> => {
  if (fromCurrency === 'EUR') return amount;
  const rates = await getExchangeRates();
  const rate = rates[fromCurrency];
  if (!rate) return amount;
  return amount / rate;
};
