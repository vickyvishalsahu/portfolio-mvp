'use client';

import { useTranslation } from 'react-i18next';

export const GmailLoading = () => {
  const { t } = useTranslation('sync');

  return <p className="text-gray-500">{t('gmail.loading')}</p>;
};
