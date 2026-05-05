'use client';

import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation('nav');

  return (
    <footer className="border-t border-gray-800 mt-12 py-4">
      <p className="text-center text-xs text-gray-600">{t('footer')}</p>
    </footer>
  );
};
