'use client';

import { useState, useEffect } from 'react';

interface Holding {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  avg_cost_eur: number;
  current_price_eur: number;
  current_value_eur: number;
  pnl: number;
  pnl_pct: number;
  currency: string;
  broker: string;
}

type SortKey = 'name' | 'current_value_eur' | 'pnl_pct' | 'quantity' | 'broker' | 'asset_type';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function pct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

const TYPE_BADGE: Record<string, string> = {
  stock: 'bg-blue-900 text-blue-300',
  etf: 'bg-purple-900 text-purple-300',
  mf: 'bg-amber-900 text-amber-300',
  crypto: 'bg-emerald-900 text-emerald-300',
};

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('current_value_eur');
  const [sortAsc, setSortAsc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHoldings();
  }, []);

  async function fetchHoldings() {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data.holdings) setHoldings(data.holdings);
    } catch {}
    setLoading(false);
  }

  async function handleRefreshPrices() {
    setRefreshing(true);
    try {
      await fetch('/api/prices', { method: 'POST' });
      await fetchHoldings();
    } catch {}
    setRefreshing(false);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'name' || key === 'broker' || key === 'asset_type');
    }
  }

  const sorted = [...holdings].sort((a, b) => {
    let cmp: number;
    if (sortKey === 'name' || sortKey === 'broker' || sortKey === 'asset_type') {
      cmp = a[sortKey].localeCompare(b[sortKey]);
    } else {
      cmp = a[sortKey] - b[sortKey];
    }
    return sortAsc ? cmp : -cmp;
  });

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="text-left pb-3 cursor-pointer hover:text-white transition select-none"
      onClick={() => handleSort(field)}
    >
      {label} {sortKey === field ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
    </th>
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Holdings</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Holdings</h1>
        <p className="text-gray-500">
          No holdings yet.{' '}
          <a href="/sync" className="text-blue-400 hover:underline">Sync emails</a> to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Holdings</h1>
        <button
          onClick={handleRefreshPrices}
          disabled={refreshing}
          className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm px-4 py-2 rounded transition"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wider">
                <SortHeader label="Name" field="name" />
                <th className="text-left pb-3">Ticker</th>
                <SortHeader label="Type" field="asset_type" />
                <SortHeader label="Qty" field="quantity" />
                <th className="text-right pb-3">Avg Cost</th>
                <th className="text-right pb-3">Price</th>
                <SortHeader label="Value" field="current_value_eur" />
                <SortHeader label="P&L %" field="pnl_pct" />
                <SortHeader label="Broker" field="broker" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr key={h.ticker} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="py-3 pl-1 text-white font-medium">{h.name}</td>
                  <td className="py-3 text-gray-400 font-mono text-xs">{h.ticker}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${TYPE_BADGE[h.asset_type] || 'bg-gray-800 text-gray-400'}`}>
                      {h.asset_type}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-300">
                    {h.quantity < 1 ? h.quantity.toFixed(6) : h.quantity.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-gray-400">{fmt(h.avg_cost_eur)}</td>
                  <td className="py-3 text-right text-gray-300">{fmt(h.current_price_eur)}</td>
                  <td className="py-3 text-right text-white font-medium">{fmt(h.current_value_eur)}</td>
                  <td className={`py-3 text-right font-medium ${h.pnl_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div>{pct(h.pnl_pct)}</div>
                    <div className="text-xs opacity-70">{fmt(h.pnl)}</div>
                  </td>
                  <td className="py-3 text-gray-500 text-xs">{h.broker}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
