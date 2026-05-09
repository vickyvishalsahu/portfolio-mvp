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

    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">
          {refreshing ? t('holdings.priceAge.updating') : t('holdings.priceAge.label', { age: formatAge(priceAge) })}
        </span>
        <a
          href="/api/export"
          download
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded transition"
        >
          {t('holdings.actions.exportCsv')}
        </a>
        <button
          onClick={onRefreshPrices}
          disabled={refreshing}
          className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm px-4 py-2 rounded transition"
        >
          {refreshing ? t('holdings.actions.refreshing') : t('holdings.actions.refreshPrices')}
        </button>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">{t('holdings.title')}</h1>
      {renderActions()}
    </div>
  );
};
