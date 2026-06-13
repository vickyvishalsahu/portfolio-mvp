'use client';

import { useTranslation } from 'react-i18next';

export const EmptyHoldingState = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('holdings.title')}</h1>
      <p className="text-gray-500">
        {t('holdings.empty.description')}{' '}
        <a href="/sync" className="text-indigo-600 hover:underline">{t('holdings.empty.syncLink')}</a>{' '}
        {t('holdings.empty.toGetStarted')}
      </p>
    </div>
  );
};
