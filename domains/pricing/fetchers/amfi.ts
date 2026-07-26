import type { RawPrice, HistoricalPrice } from '../types';
import { AMFI_BASE_URL } from '../constants';

// AMFI serves dates as DD-MM-YYYY
const toIsoDate = (amfiDate: string): string => {
  const [day, month, year] = amfiDate.split('-');
  return `${year}-${month}-${day}`;
};

export const fetchMfNav = async (isinOrScheme: string): Promise<RawPrice | null> => {
  try {
    const res = await fetch(`${AMFI_BASE_URL}/search?q=${encodeURIComponent(isinOrScheme)}`);
    const results = await res.json();

    if (results.length === 0) return null;

    const schemeCode = results[0].schemeCode;
    const navRes = await fetch(`${AMFI_BASE_URL}/${schemeCode}/latest`);
    const navData = await navRes.json();

    if (navData?.data?.[0]?.nav) {
      return { price: parseFloat(navData.data[0].nav), currency: 'INR' };
    }
    return null;
  } catch (error) {
    console.error(`AMFI NAV error for ${isinOrScheme}:`, error);
    return null;
  }
};

export const fetchMfNavHistory = async (isinOrScheme: string, fromDate: string): Promise<HistoricalPrice[] | null> => {
  try {
    const searchRes = await fetch(`${AMFI_BASE_URL}/search?q=${encodeURIComponent(isinOrScheme)}`);
    const results = await searchRes.json();
    if (results.length === 0) return null;

    const schemeCode = results[0].schemeCode;
    const historyRes = await fetch(`${AMFI_BASE_URL}/${schemeCode}`);
    const historyData = await historyRes.json();

    const entries = (historyData?.data ?? []) as Array<{ date: string; nav: string }>;
    const history = entries
      .map((entry) => ({ date: toIsoDate(entry.date), price: parseFloat(entry.nav), currency: 'INR' }))
      .filter((entry) => entry.date >= fromDate && !Number.isNaN(entry.price))
      .sort((entryA, entryB) => entryA.date.localeCompare(entryB.date));

    return history.length > 0 ? history : null;
  } catch (error) {
    console.error(`AMFI NAV history error for ${isinOrScheme}:`, error);
    return null;
  }
};
