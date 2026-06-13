'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TaxSection } from '@/app/components/tax/TaxSection';
import type { TaxData } from '@/domains/portfolio/types';

const TaxPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<TaxData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tax')
      .then((res) => res.json())
      .then((taxData: TaxData) => setData(taxData))
      .finally(() => setLoading(false));
  }, []);

  const renderDisclaimer = () => (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-700">
      {t('tax.disclaimer')}
    </div>
  );

  const renderDualJurisdictionNote = () => (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-sm text-gray-600">
      {t('tax.dualJurisdictionNote')}
    </div>
  );

  const renderFootnote = () => (
    <p className="text-gray-400 text-xs mt-4">{t('tax.holdingPeriodNote')}</p>
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('tax.title')}</h1>
        {renderDisclaimer()}
        <p className="text-gray-400">{t('tax.loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('tax.title')}</h1>
      {renderDisclaimer()}
      {data?.hasDualJurisdiction && renderDualJurisdictionNote()}
      <TaxSection jurisdiction="IN" holdings={data?.india ?? []} />
      <TaxSection jurisdiction="DE" holdings={data?.germany ?? []} />
      {renderFootnote()}
    </div>
  );
};

export default TaxPage;
