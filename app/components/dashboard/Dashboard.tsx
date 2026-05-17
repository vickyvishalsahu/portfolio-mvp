'use client';

import { useTranslation } from 'react-i18next';
import { computeNetWorthDelta } from '@/lib/snapshot-delta';
import { usePortfolio } from '@/domains/portfolio/hooks/usePortfolio';
import { DashboardSummaryCards } from './DashboardSummaryCards';
import { DashboardAllocationChart } from './DashboardAllocationChart';
import { DashboardTopHoldings } from './DashboardTopHoldings';
import { DashboardMovers } from './DashboardMovers';
import { DashboardNetWorthChart } from './DashboardNetWorthChart';
import { DashboardLoading } from './dashboard.loading';
import { DashboardEmpty } from './dashboard.empty';

export const Dashboard = () => {
  const { t } = useTranslation();
  const { data, loading, snapshots } = usePortfolio();

  if (loading) return <DashboardLoading />;

  if (!data || data.holdings.length === 0) return <DashboardEmpty />;

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
};
