'use client';

import { useTranslation } from 'react-i18next';

type Props = {
  refreshing: boolean;
  priceAge: string | null;
  formatAge: (updatedAt: string | null) => string;
  onRefreshPrices: () => void;
};

export const DashboardHeader = ({ refreshing, priceAge, formatAge, onRefreshPrices }: Props) => {
  const { t } = useTranslation();

  const priceAgeLabel = refreshing
    ? t('dashboard.priceAge.updating')
    : t('dashboard.priceAge.label', { age: formatAge(priceAge) });

  const renderSpinner = () => (
    <div className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 flex items-center gap-2">
          {refreshing && renderSpinner()}
          {priceAgeLabel}
        </span>
        <button
          onClick={onRefreshPrices}
          disabled={refreshing}
          className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          {refreshing ? t('dashboard.actions.refreshing') : t('dashboard.actions.refreshPrices')}
        </button>
      </div>
    </div>
  );
};
