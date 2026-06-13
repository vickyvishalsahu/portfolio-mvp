'use client';

import { useTranslation } from 'react-i18next';
import { formatLocal } from '@/lib/format';
import type { NetWorthDelta } from '@/lib/snapshot-delta';
import type { Summary } from '@/domains/portfolio/types';

type Props = {
  summary: Summary;
  netWorthDelta: NetWorthDelta | null;
  primaryCurrency: string;
};

const renderChangeBadge = (pct: number) => {
  const isPositive = pct >= 0;
  const badgeClass = isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500';
  const arrow = isPositive ? '↑' : '↓';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
      {arrow} {Math.abs(pct).toFixed(1)}%
    </span>
  );
};

const renderDeltaBadge = (delta: NetWorthDelta | null) => {
  if (!delta) return null;
  return renderChangeBadge(delta.deltaPct);
};

export const DashboardSummaryCards = ({ summary, netWorthDelta, primaryCurrency }: Props) => {
  const { t } = useTranslation();

  const renderCurrencyCard = (currencySummary: (typeof summary.byCurrency)[number]) => {
    const isPrimary = currencySummary.currency === primaryCurrency;
    const delta = isPrimary ? netWorthDelta : null;
    const pnlColorClass = currencySummary.totalPnl >= 0 ? 'text-emerald-600' : 'text-red-500';

    return (
      <div key={currencySummary.currency} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="text-sm text-gray-500 mb-3">
          {t('dashboard.summary.totalValue')} · {currencySummary.currency}
        </p>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <p className="text-2xl font-bold text-gray-900">
            {formatLocal(currencySummary.totalValue, currencySummary.currency)}
          </p>
          {renderDeltaBadge(delta)}
        </div>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${pnlColorClass}`}>
            {formatLocal(currencySummary.totalPnl, currencySummary.currency)}
          </p>
          {renderChangeBadge(currencySummary.totalPnlPct)}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {summary.byCurrency.map(renderCurrencyCard)}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="text-sm text-gray-500 mb-3">{t('dashboard.summary.holdings')}</p>
        <p className="text-2xl font-bold text-gray-900">{summary.holdingsCount}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <p className="text-sm text-gray-500 mb-3">{t('dashboard.summary.transactions')}</p>
        <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
      </div>
    </div>
  );
};
