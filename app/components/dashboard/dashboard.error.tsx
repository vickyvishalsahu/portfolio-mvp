'use client';

import { useTranslation } from 'react-i18next';

type Props = {
  message?: string;
};

export const DashboardError = ({ message }: Props) => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
      <p className="text-red-400">{message ?? t('dashboard.error.default')}</p>
    </div>
  );
};
