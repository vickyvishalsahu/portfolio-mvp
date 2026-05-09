'use client';

import { useState, useEffect } from 'react';
import type { PortfolioData } from '@/domains/portfolio/types';

export const usePortfolio = () => {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<{ date: string; totalValue: number }[]>([]);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((response) => response.json())
      .then((portfolioData) => {
        if (portfolioData.summary) setData(portfolioData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  return { data, loading, snapshots };
};
