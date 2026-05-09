'use client';

import { useTranslation } from 'react-i18next';
import { computeNetWorthDelta } from '@/lib/snapshot-delta';
import { usePortfolio } from '@/app/hooks/usePortfolio';
import { DashboardSummaryCards } from './components/dashboard/DashboardSummaryCards';
import { DashboardAllocationChart } from './components/dashboard/DashboardAllocationChart';
import { DashboardTopHoldings } from './components/dashboard/DashboardTopHoldings';
import { DashboardMovers } from './components/dashboard/DashboardMovers';
import { DashboardNetWorthChart } from './components/dashboard/DashboardNetWorthChart'
import { SkeletonLoading } from '@/app/components/SkeletonLoading';

export default function Dashboard() {
  const { t } = useTranslation();
  const { data, loading, snapshots } = usePortfolio();

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SkeletonLoading classNameList="h-28" />
          <SkeletonLoading classNameList="h-28" />
          <SkeletonLoading classNameList="h-28" />
          <SkeletonLoading classNameList="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SkeletonLoading classNameList="h-72" />
          <SkeletonLoading classNameList="h-72" />
        </div>
        <SkeletonLoading classNameList="h-48 mb-8" />
        <SkeletonLoading classNameList="h-64" />
      </div>
    );
  }

  if (!data || data.holdings.length === 0) {
    const emptyLabels = [t('dashboard.summary.totalValue'), t('dashboard.summary.totalPnl'), t('dashboard.summary.holdings')];
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {emptyLabels.map((label) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-sm">{label}</p>
              <p className="text-2xl font-bold text-white">--</p>
            </div>
          ))}
        </div>
        <p className="text-gray-500">
          {t('dashboard.empty.description')}{' '}
          <a href="/sync" className="text-blue-400 hover:underline">{t('dashboard.empty.cta')}</a>
        </p>
      </div>
    );
  }

  const { summary, holdings } = data;
  const primaryCurrency = summary.byCurrency[0]?.currency ?? 'INR';
  const netWorthDelta = computeNetWorthDelta(snapshots);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
      <DashboardSummaryCards summary={summary} netWorthDelta={netWorthDelta} primaryCurrency={primaryCurrency} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DashboardAllocationChart holdings={holdings} brokerAllocation={data.brokerAllocation} primaryCurrency={primaryCurrency} />
        <DashboardTopHoldings holdings={holdings} />
      </div>
      <DashboardMovers holdings={holdings} />
      {snapshots.length > 1 && <DashboardNetWorthChart snapshots={snapshots} primaryCurrency={primaryCurrency} />}
    </div>
  );
}
