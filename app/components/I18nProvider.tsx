'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';

export const I18nProvider = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);
