'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Holding } from '@/domains/shared/types';

export type SortKey = 'name' | 'currentValueEur' | 'pnlPct' | 'quantity' | 'broker' | 'assetType';

const STRING_SORT_KEYS = new Set<SortKey>(['name', 'broker', 'assetType']);

export const useHoldings = () => {
  const { t } = useTranslation();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('currentValueEur');
  const [sortAsc, setSortAsc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [priceAge, setPriceAge] = useState<string | null>(null);
  const [failedTickers, setFailedTickers] = useState<string[]>([]);

  const fetchHoldings = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data.holdings) setHoldings(data.holdings);
      if ('priceCacheUpdatedAt' in data) setPriceAge(data.priceCacheUpdatedAt);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    setFailedTickers([]);
    try {
      const res = await fetch('/api/prices', { method: 'POST' });
      const data = await res.json();
      if (data.failed?.length) setFailedTickers(data.failed);
      await fetchHoldings();
    } catch {}
    setRefreshing(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(STRING_SORT_KEYS.has(key));
    }
  };

  const sorted = [...holdings].sort((holdingA, holdingB) => {
    const cmp = STRING_SORT_KEYS.has(sortKey)
      ? (holdingA[sortKey] as string).localeCompare(holdingB[sortKey] as string)
      : (holdingA[sortKey] as number) - (holdingB[sortKey] as number);
    return sortAsc ? cmp : -cmp;
  });

  const formatAge = (updatedAt: string | null): string => {
    if (!updatedAt) return t('holdings.priceAge.never');
    const mins = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
    if (mins < 1) return t('holdings.priceAge.justNow');
    if (mins === 1) return t('holdings.priceAge.oneMinAgo');
    if (mins < 60) return t('holdings.priceAge.minsAgo', { mins });
    const hrs = Math.floor(mins / 60);
    return hrs === 1 ? t('holdings.priceAge.oneHourAgo') : t('holdings.priceAge.hoursAgo', { hrs });
  };

  return {
    holdings: sorted,
    loading,
    refreshing,
    priceAge,
    failedTickers,
    sortKey,
    sortAsc,
    handleSort,
    handleRefreshPrices,
    formatAge,
  };
};
