import type { RawPrice } from '../types';
import { AMFI_BASE_URL } from '../constants';

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
