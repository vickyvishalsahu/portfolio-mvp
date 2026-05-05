'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fmtEur, fmtHolding, pct } from '@/lib/format';

type Holding = {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  avg_cost_eur: number;
  avg_cost_local: number;
  current_price_eur: number;
  current_price_local: number;
  current_value_eur: number;
  current_value_local: number;
  pnl: number;
  pnl_local: number;
  pnl_pct: number;
  currency: string;
  broker: string;
}

type SortKey = 'name' | 'current_value_eur' | 'pnl_pct' | 'quantity' | 'broker' | 'asset_type';

const TYPE_BADGE: Record<string, string> = {
  stock: 'bg-blue-900 text-blue-300',
  etf: 'bg-purple-900 text-purple-300',
  mf: 'bg-amber-900 text-amber-300',
  crypto: 'bg-emerald-900 text-emerald-300',
};


const HoldingsPage = () => {
  const { t } = useTranslation('holdings');

  const formatAge = (updatedAt: string | null): string => {
    if (!updatedAt) return t('priceAge.never');
    const mins = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60000);
    if (mins < 1) return t('priceAge.justNow');
    if (mins === 1) return t('priceAge.oneMinAgo');
    if (mins < 60) return t('priceAge.minsAgo', { mins });
    const hrs = Math.floor(mins / 60);
    return hrs === 1 ? t('priceAge.oneHourAgo') : t('priceAge.hoursAgo', { hrs });
  };

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('current_value_eur');
  const [sortAsc, setSortAsc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [priceAge, setPriceAge] = useState<string | null>(null);
  const [failedTickers, setFailedTickers] = useState<string[]>([]);

  const fetchHoldings = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data.holdings) setHoldings(data.holdings);
      if ('price_cache_updated_at' in data) setPriceAge(data.price_cache_updated_at);
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
      setSortAsc(key === 'name' || key === 'broker' || key === 'asset_type');
    }
  };

  const sorted = [...holdings].sort((holdingA, holdingB) => {
    let cmp: number;
    if (sortKey === 'name' || sortKey === 'broker' || sortKey === 'asset_type') {
      cmp = holdingA[sortKey].localeCompare(holdingB[sortKey]);
    } else {
      cmp = holdingA[sortKey] - holdingB[sortKey];
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="text-left pb-3 cursor-pointer hover:text-white transition select-none"
      onClick={() => handleSort(field)}
    >
      {label} {sortKey === field ? (sortAsc ? '▲' : '▼') : ''}
    </th>
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <p className="text-gray-500">
          {t('empty.description')}{' '}
          <a href="/sync" className="text-blue-400 hover:underline">{t('empty.syncLink')}</a>{' '}
          {t('empty.toGetStarted')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {refreshing ? t('priceAge.updating') : t('priceAge.label', { age: formatAge(priceAge) })}
          </span>
          <a
            href="/api/export"
            download
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition"
          >
            {t('actions.exportCsv')}
          </a>
          <button
            onClick={handleRefreshPrices}
            disabled={refreshing}
            className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm px-4 py-2 rounded transition"
          >
            {refreshing ? t('actions.refreshing') : t('actions.refreshPrices')}
          </button>
        </div>
      </div>

      {failedTickers.length > 0 && (
        <div className="bg-amber-950 border border-amber-800 rounded p-3 mb-4 text-sm text-amber-400">
          {t('failedPrices', { tickers: failedTickers.join(', ') })}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wider">
                <SortHeader label={t('columns.name')} field="name" />
                <th className="text-left pb-3">{t('columns.ticker')}</th>
                <SortHeader label={t('columns.type')} field="asset_type" />
                <SortHeader label={t('columns.qty')} field="quantity" />
                <th className="text-right pb-3">{t('columns.avgCost')}</th>
                <th className="text-right pb-3">{t('columns.price')}</th>
                <SortHeader label={t('columns.value')} field="current_value_eur" />
                <SortHeader label={t('columns.pnlPct')} field="pnl_pct" />
                <SortHeader label={t('columns.broker')} field="broker" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((holding) => (
                <tr key={holding.ticker} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="py-3 pl-1 text-white font-medium">{holding.name}</td>
                  <td className="py-3 text-gray-400 font-mono text-xs">{holding.ticker}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${TYPE_BADGE[holding.asset_type] || 'bg-gray-800 text-gray-400'}`}>
                      {holding.asset_type}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-300">
                    {holding.quantity < 1 ? holding.quantity.toFixed(6) : holding.quantity.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-gray-400">
                    {fmtHolding(holding.avg_cost_local, holding.avg_cost_eur, holding.currency)}
                  </td>
                  <td className="py-3 text-right text-gray-300">
                    {fmtHolding(holding.current_price_local, holding.current_price_eur, holding.currency)}
                  </td>
                  <td className="py-3 text-right">
                    <div className="text-white font-medium">
                      {fmtHolding(holding.current_value_local, holding.current_value_eur, holding.currency)}
                    </div>
                    {holding.currency !== 'EUR' && (
                      <div className="text-gray-600 text-xs">{fmtEur(holding.current_value_eur)}</div>
                    )}
                  </td>
                  <td className={`py-3 text-right font-medium ${holding.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div>{pct(holding.pnl_pct)}</div>
                    <div className="text-xs opacity-70">
                      {fmtHolding(holding.pnl_local, holding.pnl, holding.currency)}
                    </div>
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{holding.broker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HoldingsPage;
