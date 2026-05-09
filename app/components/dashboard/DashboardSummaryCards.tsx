'use client';

import { useTranslation } from 'react-i18next';
import { fmtLocal, pct } from '@/lib/format';
import type { NetWorthDelta } from '@/lib/snapshot-delta';
import type { Summary } from '@/domains/portfolio/types';

type Props = {
  summary: Summary;
  netWorthDelta: NetWorthDelta | null;
  primaryCurrency: string;
};

export const DashboardSummaryCards = ({ summary, netWorthDelta, primaryCurrency }: Props) => {
  const { t } = useTranslation();

  const renderDelta = (currency: string, delta: NetWorthDelta | null) => {
    if (!delta) return null;
    const isPositive = delta.delta >= 0;
    const sign = isPositive ? '+' : '';
    return (
      <p className={`text-xs mt-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '↑' : '↓'} {sign}{fmtLocal(delta.delta, currency)} ({sign}{delta.deltaPct.toFixed(1)}%) {t('dashboard.movers.vsLast30d')}
      </p>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {summary.byCurrency.map((currencySummary) => {
        const isPrimary = currencySummary.currency === primaryCurrency;
        const delta = isPrimary ? netWorthDelta : null;

        return (
          <div key={currencySummary.currency} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">{t('dashboard.summary.totalValue')}</p>
            <p className="text-2xl font-bold text-white">{fmtLocal(currencySummary.totalValue, currencySummary.currency)}</p>
            <p className={`text-sm font-medium mt-1 ${currencySummary.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {fmtLocal(currencySummary.totalPnl, currencySummary.currency)} {pct(currencySummary.totalPnlPct)}
            </p>
            {renderDelta(currencySummary.currency, delta)}
          </div>
        );
      })}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <p className="text-gray-400 text-sm">{t('dashboard.summary.holdings')}</p>
        <p className="text-2xl font-bold text-white">{summary.holdingsCount}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <p className="text-gray-400 text-sm">{t('dashboard.summary.transactions')}</p>
        <p className="text-2xl font-bold text-white">{summary.transactionCount}</p>
      </div>
    </div>
  );
};
