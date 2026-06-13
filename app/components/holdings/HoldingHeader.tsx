'use client';

import { useTranslation } from 'react-i18next';
import { SkeletonLoading } from '@/app/components/SkeletonLoading';

type Props = {
  loading?: boolean;
  refreshing: boolean;
  priceAge: string | null;
  formatAge: (updatedAt: string | null) => string;
  onRefreshPrices: () => void;
};

export const HoldingHeader = ({ loading, refreshing, priceAge, formatAge, onRefreshPrices }: Props) => {
  const { t } = useTranslation();

  const renderActions = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3">
          <SkeletonLoading classNameList="h-3 w-32" />
          <SkeletonLoading classNameList="h-8 w-24" />
          <SkeletonLoading classNameList="h-8 w-28" />
        </div>
      );
    }

    const priceAgeLabel = refreshing
      ? t('holdings.priceAge.updating')
      : t('holdings.priceAge.label', { age: formatAge(priceAge) });

    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">{priceAgeLabel}</span>
        <a
          href="/api/export"
          download
          className="bg-slate-100 hover:bg-slate-200 text-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          {t('holdings.actions.exportCsv')}
        </a>
        <button
          onClick={onRefreshPrices}
          disabled={refreshing}
          className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          {refreshing ? t('holdings.actions.refreshing') : t('holdings.actions.refreshPrices')}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('holdings.title')}</h1>
      {renderActions()}
    </div>
  );
};
