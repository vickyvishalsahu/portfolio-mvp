'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Holding {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  avg_cost_eur: number;
  current_price_eur: number;
  current_value_eur: number;
  prev_value_eur: number | null;
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
  delta_30d: number | null;
  delta_7d: number | null;
}

interface PortfolioData {
  summary: Summary;
  holdings: Holding[];
  broker_allocation: Record<string, number>;
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
  const [snapshots, setSnapshots] = useState<{ date: string; total_value_eur: number }[]>([]);
  const [allocView, setAllocView] = useState<'type' | 'broker'>('type');

  useEffect(() => {
    fetch('/api/portfolio')
      .then((r) => r.json())
      .then((d) => { if (d.summary) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/snapshots')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSnapshots(d); })
      .catch(() => {});
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

  const BROKER_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

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

  const allocationByBroker = Object.entries(data.broker_allocation || {}).map(([broker, value], i) => ({
    name: broker,
    value: Math.round((value as number) * 100) / 100,
    color: BROKER_COLORS[i % BROKER_COLORS.length],
  }));

  const allocationData = allocView === 'type' ? allocationByType : allocationByBroker;

  // Top holdings for mini table
  const topHoldings = holdings.slice(0, 5);

  // Biggest movers — only holdings where previous price data exists
  const withChange = holdings
    .filter((h) => h.prev_value_eur !== null)
    .map((h) => ({
      ...h,
      change: h.current_value_eur - h.prev_value_eur!,
      change_pct: ((h.current_value_eur - h.prev_value_eur!) / h.prev_value_eur!) * 100,
    }))
    .sort((a, b) => b.change - a.change);
  const topGainers = withChange.slice(0, 3);
  const topLosers = [...withChange].reverse().slice(0, 3).filter((h) => h.change < 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Total Value</p>
          <p className="text-2xl font-bold text-white">{fmt(summary.total_value_eur)}</p>
          {summary.delta_30d !== null && (
            <p className={`text-xs mt-1 ${summary.delta_30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary.delta_30d >= 0 ? '↑' : '↓'} {fmt(Math.abs(summary.delta_30d))} vs 30d ago
            </p>
          )}
          {summary.delta_30d === null && summary.delta_7d !== null && (
            <p className={`text-xs mt-1 ${summary.delta_7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {summary.delta_7d >= 0 ? '↑' : '↓'} {fmt(Math.abs(summary.delta_7d))} vs 7d ago
            </p>
          )}
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Allocation</h2>
            <div className="flex text-xs rounded overflow-hidden border border-gray-700">
              <button
                onClick={() => setAllocView('type')}
                className={`px-3 py-1 transition ${allocView === 'type' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                By Type
              </button>
              <button
                onClick={() => setAllocView('broker')}
                className={`px-3 py-1 transition ${allocView === 'broker' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                By Broker
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={allocationData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {allocationData.map((entry, i) => (
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

      {withChange.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Biggest Movers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Gainers</p>
              {topGainers.length === 0 ? (
                <p className="text-gray-600 text-sm">No gains since last refresh</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {topGainers.map((h) => (
                      <tr key={h.ticker} className="border-b border-gray-800/50">
                        <td className="py-2">
                          <span className="text-white">{h.name}</span>
                          <span className="text-gray-500 text-xs ml-2">{h.ticker}</span>
                        </td>
                        <td className="text-right text-green-400 font-medium">
                          +{fmt(h.change)}
                        </td>
                        <td className="text-right text-green-500 text-xs w-16">
                          +{h.change_pct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Losers</p>
              {topLosers.length === 0 ? (
                <p className="text-gray-600 text-sm">No losses since last refresh</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {topLosers.map((h) => (
                      <tr key={h.ticker} className="border-b border-gray-800/50">
                        <td className="py-2">
                          <span className="text-white">{h.name}</span>
                          <span className="text-gray-500 text-xs ml-2">{h.ticker}</span>
                        </td>
                        <td className="text-right text-red-400 font-medium">
                          {fmt(h.change)}
                        </td>
                        <td className="text-right text-red-500 text-xs w-16">
                          {h.change_pct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {snapshots.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Net Worth Over Time</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={snapshots} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(d) => {
                  const [, month, day] = d.split('-');
                  return `${day}/${month}`;
                }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip
                formatter={(value: any) => [fmt(Number(value)), 'Portfolio']}
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="total_value_eur"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
