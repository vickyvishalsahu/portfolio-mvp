'use client';

import { useTranslation } from 'react-i18next';
import { NotificationBell } from './NotificationBell';

export const Nav = () => {
  const { t } = useTranslation();

  return (
    <nav className="border-b border-gray-800 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center gap-6">
        <a href="/" className="text-lg font-bold text-white">{t('nav.brand')}</a>
        <a href="/sync" className="text-gray-400 hover:text-white transition">{t('nav.links.sync')}</a>
        <a href="/holdings" className="text-gray-400 hover:text-white transition">{t('nav.links.holdings')}</a>
        <a href="/transactions/new" className="text-gray-400 hover:text-white transition">{t('nav.links.addTransaction')}</a>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </div>
    </nav>
  );
};
