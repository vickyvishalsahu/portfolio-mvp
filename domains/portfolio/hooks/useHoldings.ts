'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Holding } from '@/domains/shared/types';
import { formatPriceAge } from '@/domains/portfolio/priceAge';
import { usePriceRefresh } from './usePriceRefresh';

export type SortKey = 'name' | 'currentValueEur' | 'pnlPct' | 'quantity' | 'broker' | 'assetType';

const STRING_SORT_KEYS = new Set<SortKey>(['name', 'broker', 'assetType']);

export const useHoldings = () => {
  const { t } = useTranslation();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('currentValueEur');
  const [sortAsc, setSortAsc] = useState(false);
  const [priceAge, setPriceAge] = useState<string | null>(null);
  const [orphanedSells, setOrphanedSells] = useState<string[]>([]);
  const { refreshing, failedTickers, refreshPrices } = usePriceRefresh();

  const fetchHoldings = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data.holdings) setHoldings(data.holdings);
      if ('priceCacheUpdatedAt' in data) setPriceAge(data.priceCacheUpdatedAt);
      if (data.orphanedSells) setOrphanedSells(data.orphanedSells);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchHoldings();
  }, []);

  const handleRefreshPrices = () => refreshPrices(fetchHoldings);

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

  const formatAge = (updatedAt: string | null): string => formatPriceAge(updatedAt, t, 'holdings.priceAge');

  return {
    holdings: sorted,
    loading,
    refreshing,
    priceAge,
    failedTickers,
    orphanedSells,
    sortKey,
    sortAsc,
    handleSort,
    handleRefreshPrices,
    formatAge,
  };
};
