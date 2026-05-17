'use client';

import { useTranslation } from 'react-i18next';

export const DashboardEmpty = () => {
  const { t } = useTranslation();

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
};
