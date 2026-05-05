'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fmtLocal, fmtHolding, pct } from '@/lib/format';
import { computeNetWorthDelta } from '@/lib/snapshot-delta';

type CurrencySummary = {
  currency: string;
  total_value: number;
  total_pnl: number;
  total_pnl_pct: number;
}

type Summary = {
  by_currency: CurrencySummary[];
  holdings_count: number;
  transaction_count: number;
}

type Holding = {
  ticker: string;
  name: string;
  asset_type: string;
  quantity: number;
  avg_cost_eur: number;
  current_price_eur: number;
  current_value_eur: number;
  current_value_local: number;
  prev_value_eur: number | null;
  prev_value_local: number | null;
  pnl: number;
  pnl_pct: number;
  currency: string;
  broker: string;
}

type PortfolioData = {
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


export default function Dashboard() {
  const { t } = useTranslation('dashboard');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<{ date: string; total_value: number }[]>([]);
  const [allocView, setAllocView] = useState<'type' | 'broker'>('type');

  useEffect(() => {
    fetch('/api/portfolio')
      .then((response) => response.json())
      .then((data) => { if (data.summary) setData(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch snapshots for the primary currency once portfolio data is available
  useEffect(() => {
    if (!data) return;
    const primaryCurrency = data.summary.by_currency[0]?.currency;
    if (!primaryCurrency) return;
    fetch(`/api/snapshots?currency=${primaryCurrency}`)
      .then((response) => response.json())
      .then((data) => { if (Array.isArray(data)) setSnapshots(data); })
      .catch(() => {});
  }, [data]);

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <p className="text-gray-500">{t('loading')}</p>
      </div>
    );
  }

  if (!data || data.holdings.length === 0) {
    const emptyLabels = [t('summary.totalValue'), t('summary.totalPnl'), t('summary.holdings')];
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {emptyLabels.map((label) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-sm">{label}</p>
              <p className="text-2xl font-bold text-white">--</p>
            </div>
          ))}
        </div>
        <p className="text-gray-500">
          {t('empty.description')}{' '}
          <a href="/sync" className="text-blue-400 hover:underline">{t('empty.cta')}</a>
        </p>
      </div>
    );
  }

  const { summary, holdings } = data;
  const primaryCurrency = summary.by_currency[0]?.currency ?? 'INR';
  const netWorthDelta = computeNetWorthDelta(snapshots);

  const BROKER_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  // Allocation uses local values — valid for single currency; multi-currency: TODO
  const allocationByType = Object.entries(
    holdings.reduce<Record<string, number>>((acc, h) => {
      acc[h.asset_type] = (acc[h.asset_type] || 0) + h.current_value_local;
      return acc;
    }, {})
  ).map(([type, value]) => ({
    name: t(`assetLabels.${type}`, { defaultValue: type }),
    value: Math.round(value * 100) / 100,
    color: ASSET_COLORS[type] || '#6b7280',
  }));

  const allocationByBroker = Object.entries(data.broker_allocation || {}).map(([broker, value], i) => ({
    name: broker,
    value: Math.round((value as number) * 100) / 100,
    color: BROKER_COLORS[i % BROKER_COLORS.length],
  }));

  const allocationData = allocView === 'type' ? allocationByType : allocationByBroker;

  const topHoldings = holdings.slice(0, 5);

  // Biggest movers — use local values, filter on prev_value_local
  const withChange = holdings
    .filter((holding) => holding.prev_value_local !== null)
    .map((holding) => ({
      ...holding,
      change: holding.current_value_local - holding.prev_value_local!,
      change_pct: ((holding.current_value_local - holding.prev_value_local!) / holding.prev_value_local!) * 100,
    }))
    .sort((holdingA, holdingB) => holdingB.change - holdingA.change);
  const topGainers = withChange.slice(0, 3);
  const topLosers = [...withChange].reverse().slice(0, 3).filter((holding) => holding.change < 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>

      {/* Summary Cards — one per currency + counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {summary.by_currency.map((s) => {
          const isPrimary = s.currency === primaryCurrency;
          const delta = isPrimary ? netWorthDelta : null;

          const renderDelta = () => {
            if (!delta) return null;
            const isPositive = delta.delta >= 0;
            const sign = isPositive ? '+' : '';
            return (
              <p className={`text-xs mt-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '↑' : '↓'} {sign}{fmtLocal(delta.delta, s.currency)} ({sign}{delta.deltaPct.toFixed(1)}%) {t('movers.vsLast30d')}
              </p>
            );
          };

          return (
            <div key={s.currency} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-sm">{t('summary.totalValue')}</p>
              <p className="text-2xl font-bold text-white">{fmtLocal(s.total_value, s.currency)}</p>
              <p className={`text-sm font-medium mt-1 ${s.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmtLocal(s.total_pnl, s.currency)} {pct(s.total_pnl_pct)}
              </p>
              {renderDelta()}
            </div>
          );
        })}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400 text-sm">{t('summary.holdings')}</p>
          <p className="text-2xl font-bold text-white">{summary.holdings_count}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400 text-sm">{t('summary.transactions')}</p>
          <p className="text-2xl font-bold text-white">{summary.transaction_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Allocation Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('allocation.title')}</h2>
            <div className="flex text-xs rounded overflow-hidden border border-gray-700">
              <button
                onClick={() => setAllocView('type')}
                className={`px-3 py-1 transition ${allocView === 'type' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {t('allocation.byType')}
              </button>
              <button
                onClick={() => setAllocView('broker')}
                className={`px-3 py-1 transition ${allocView === 'broker' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {t('allocation.byBroker')}
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
                formatter={(value: any) => fmtLocal(Number(value), primaryCurrency)}
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Holdings */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{t('topHoldings.title')}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left pb-2">{t('topHoldings.name')}</th>
                <th className="text-right pb-2">{t('topHoldings.value')}</th>
                <th className="text-right pb-2">{t('topHoldings.pnl')}</th>
              </tr>
            </thead>
            <tbody>
              {topHoldings.map((h) => (
                <tr key={h.ticker} className="border-b border-gray-800/50">
                  <td className="py-2">
                    <span className="text-white">{h.name}</span>
                    <span className="text-gray-500 text-xs ml-2">{h.ticker}</span>
                  </td>
                  <td className="text-right text-white">
                    {fmtHolding(h.current_value_local, h.current_value_eur, h.currency)}
                  </td>
                  <td className={`text-right ${h.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pct(h.pnl_pct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {holdings.length > 5 && (
            <a href="/holdings" className="text-blue-400 hover:underline text-sm mt-3 inline-block">
              {t('topHoldings.viewAll', { count: holdings.length })}
            </a>
          )}
        </div>
      </div>

      {withChange.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('movers.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{t('movers.gainers')}</p>
              {topGainers.length === 0 ? (
                <p className="text-gray-600 text-sm">{t('movers.noGains')}</p>
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
                          +{fmtLocal(h.change, h.currency)}
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
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{t('movers.losers')}</p>
              {topLosers.length === 0 ? (
                <p className="text-gray-600 text-sm">{t('movers.noLosses')}</p>
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
                          {fmtLocal(h.change, h.currency)}
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
          <h2 className="text-lg font-semibold mb-4">{t('netWorth.title')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={snapshots} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(dateString) => {
                  const [, month, day] = dateString.split('-');
                  return `${day}/${month}`;
                }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(value) => fmtLocal(value, primaryCurrency)}
                width={64}
              />
              <Tooltip
                formatter={(value: any) => [fmtLocal(Number(value), primaryCurrency), t('netWorth.portfolio')]}
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="total_value"
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
