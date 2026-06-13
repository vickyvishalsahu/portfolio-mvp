'use client';

import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-slate-100 mt-12 py-4 bg-white">
      <p className="text-center text-xs text-gray-400">{t('nav.footer')}</p>
    </footer>
  );
};
