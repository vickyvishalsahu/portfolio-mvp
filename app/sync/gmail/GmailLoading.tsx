'use client';

import { useTranslation } from 'react-i18next';

export const GmailLoading = () => {
  const { t } = useTranslation();

  return <p className="text-gray-500">{t('sync.gmail.loading')}</p>;
};
