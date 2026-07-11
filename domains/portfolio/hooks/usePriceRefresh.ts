'use client';

import { useState } from 'react';

export type UsePriceRefreshResult = {
  refreshing: boolean;
  failedTickers: string[];
  refreshPrices: (onComplete: () => Promise<void> | void) => Promise<void>;
};

export const usePriceRefresh = (): UsePriceRefreshResult => {
  const [refreshing, setRefreshing] = useState(false);
  const [failedTickers, setFailedTickers] = useState<string[]>([]);

  const refreshPrices = async (onComplete: () => Promise<void> | void) => {
    setRefreshing(true);
    setFailedTickers([]);
    try {
      const res = await fetch('/api/prices', { method: 'POST' });
      const data = await res.json();
      if (data.failed?.length) setFailedTickers(data.failed);
      await onComplete();
    } catch {}
    setRefreshing(false);
  };

  return { refreshing, failedTickers, refreshPrices };
};
