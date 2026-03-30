'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  broker: string;
}

interface Summary {
  total_value_eur: number;
  total_cost_eur: number;
  total_pnl: number;
  total_pnl_pct: number;
  holdings_count: number;
  transaction_count: number;
}

interface PortfolioData {
  summary: Summary;
  holdings: Holding[];
}

const ASSET_COLORS: Record<string, string> = {
  stock: '#3b82f6',
  etf: '#8b5cf6',
  mf: '#f59e0b',
  crypto: '#10b981',
};

const ASSET_LABELS: Record<string, string> = {
  stock: 'Stocks',
  etf: 'ETFs',
  mf: 'Mutual Funds',
  crypto: 'Crypto',
};

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

export default function Dashboard() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((r) => r.json())
      .then((d) => { if (d.summary) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!data || data.holdings.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {['Total Value', 'Total P&L', 'Holdings'].map((label) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-sm">{label}</p>
              <p className="text-2xl font-bold text-white">--</p>
            </div>
          ))}
        </div>
        <p className="text-gray-500">
          Connect Gmail and sync emails to get started.{' '}
          <a href="/sync" className="text-blue-400 hover:underline">Go to Sync</a>
        </p>
      </div>
    );
  }

  const { summary, holdings } = data;

  // Allocation by asset type
  const allocationByType = Object.entries(
    holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.asset_type] = (acc[h.asset_type] || 0) + h.current_value_eur;
      return acc;
    }, {})
  ).map(([type, value]) => ({
    name: ASSET_LABELS[type] || type,
    value: Math.round(value * 100) / 100,
    color: ASSET_COLORS[type] || '#6b7280',
  }));

  // Top holdings for mini table
  const topHoldings = holdings.slice(0, 5);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total Value</p>
          <p className="text-2xl font-bold text-white">{fmt(summary.total_value_eur)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total P&L</p>
          <p className={`text-2xl font-bold ${summary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmt(summary.total_pnl)}
          </p>
          <p className={`text-sm ${summary.total_pnl_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {pct(summary.total_pnl_pct)}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Holdings</p>
          <p className="text-2xl font-bold text-white">{summary.holdings_count}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Transactions</p>
          <p className="text-2xl font-bold text-white">{summary.transaction_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Allocation Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Allocation</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={allocationByType}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {allocationByType.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => fmt(Number(value))}
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Holdings */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Top Holdings</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left pb-2">Name</th>
                <th className="text-right pb-2">Value</th>
                <th className="text-right pb-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              {topHoldings.map((h) => (
                <tr key={h.ticker} className="border-b border-gray-800/50">
                  <td className="py-2">
                    <span className="text-white">{h.name}</span>
                    <span className="text-gray-500 text-xs ml-2">{h.ticker}</span>
                  </td>
                  <td className="text-right text-white">{fmt(h.current_value_eur)}</td>
                  <td className={`text-right ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pct(h.pnl_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {holdings.length > 5 && (
            <a href="/holdings" className="text-blue-400 hover:underline text-sm mt-3 inline-block">
              View all {holdings.length} holdings
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
