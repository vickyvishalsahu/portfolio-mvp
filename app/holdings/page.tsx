'use client';

import { useTranslation } from 'react-i18next';
import { useHoldings } from '@/domains/portfolio/hooks/useHoldings';
import { HoldingTable } from '@/app/components/holdings/HoldingTable';
import { HoldingHeader } from '@/app/components/holdings/HoldingHeader';
import { EmptyHoldingState } from '@/app/components/holdings/EmptyHoldingState';

const HoldingsPage = () => {
  const { t } = useTranslation();
  const {
    holdings,
    loading,
    refreshing,
    priceAge,
    failedTickers,
    sortKey,
    sortAsc,
    handleSort,
    handleRefreshPrices,
    formatAge,
  } = useHoldings();

  if (!loading && holdings.length === 0) return <EmptyHoldingState />;

  return (
    <div>
      <HoldingHeader
        loading={loading}
        refreshing={refreshing}
        priceAge={priceAge}
        formatAge={formatAge}
        onRefreshPrices={handleRefreshPrices}
      />

      {!loading && failedTickers.length > 0 && (
        <div className="bg-amber-950 border border-amber-800 rounded p-3 mb-4 text-sm text-amber-400">
          {t('holdings.failedPrices', { tickers: failedTickers.join(', ') })}
        </div>
      )}

      <HoldingTable loading={loading} holdings={holdings} sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
    </div>
  );
};

export default HoldingsPage;
