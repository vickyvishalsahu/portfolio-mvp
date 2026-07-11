'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PortfolioData } from '@/domains/portfolio/types';
import { formatPriceAge } from '@/domains/portfolio/priceAge';
import { usePriceRefresh } from './usePriceRefresh';

export const usePortfolio = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<{ date: string; totalValue: number }[]>([]);
  const [priceAge, setPriceAge] = useState<string | null>(null);
  const { refreshing, failedTickers, refreshPrices } = usePriceRefresh();

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const portfolioData = await res.json();
      if (portfolioData.summary) setData(portfolioData);
      if ('priceCacheUpdatedAt' in portfolioData) setPriceAge(portfolioData.priceCacheUpdatedAt);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  useEffect(() => {
    if (!data) return;
    const primaryCurrency = data.summary.byCurrency[0]?.currency;
    if (!primaryCurrency) return;
    fetch(`/api/snapshots?currency=${primaryCurrency}`)
      .then((response) => response.json())
      .then((snapshotData) => {
        if (Array.isArray(snapshotData)) setSnapshots(snapshotData);
      })
      .catch(() => {});
  }, [data]);

  const handleRefreshPrices = () => refreshPrices(fetchPortfolio);
  const formatAge = (updatedAt: string | null): string => formatPriceAge(updatedAt, t, 'dashboard.priceAge');

  return { data, loading, snapshots, priceAge, refreshing, failedTickers, handleRefreshPrices, formatAge };
};
