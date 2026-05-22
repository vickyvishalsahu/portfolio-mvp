'use client';

import { useTranslation } from 'react-i18next';
import { fmtLocal } from '@/lib/format';
import type { TaxHolding, Jurisdiction } from '@/domains/portfolio/types';
import { TaxClassBadge } from './TaxClassBadge';

type Props = {
  jurisdiction: Jurisdiction;
  holdings: TaxHolding[];
};

const formatHoldingPeriod = (days: number): string => {
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}m`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}y ${months}m` : `${years}y`;
};

export const TaxSection = ({ jurisdiction, holdings }: Props) => {
  const { t } = useTranslation();

  const isIndia = jurisdiction === 'IN';
  const titleKey = isIndia ? 'tax.india.title' : 'tax.germany.title';
  const subtitleKey = isIndia ? 'tax.india.subtitle' : 'tax.germany.subtitle';
  const emptyKey = isIndia ? 'tax.india.empty' : 'tax.germany.empty';

  const totalGain = holdings.reduce((sum, h) => sum + h.unrealisedGain, 0);
  const gainCurrency = holdings[0]?.currency ?? (isIndia ? 'INR' : 'EUR');

  const renderEmpty = () => (
    <p className="text-gray-600 text-sm py-4">{t(emptyKey)}</p>
  );

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-800">
            <th className="text-left pb-3">{t('tax.columns.holding')}</th>
            <th className="text-left pb-3">{t('tax.columns.period')}</th>
            <th className="text-right pb-3">{t('tax.columns.gain')}</th>
            <th className="text-right pb-3">{t('tax.columns.class')}</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const gainColor = holding.unrealisedGain >= 0 ? 'text-green-400' : 'text-red-400';
            return (
              <tr key={`${holding.ticker}-${holding.broker}`} className="border-b border-gray-800/50">
                <td className="py-3">
                  <span className="text-white font-medium">{holding.name}</span>
                  {holding.ticker && (
                    <span className="text-gray-500 text-xs ml-2">{holding.ticker}</span>
                  )}
                </td>
                <td className="py-3 text-gray-400">{formatHoldingPeriod(holding.holdingDays)}</td>
                <td className={`py-3 text-right font-medium ${gainColor}`}>
                  {fmtLocal(holding.unrealisedGain, holding.currency)}
                </td>
                <td className="py-3 text-right">
                  <TaxClassBadge taxClass={holding.taxClass} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderSummary = () => {
    if (holdings.length === 0) return null;
    const gainColor = totalGain >= 0 ? 'text-green-400' : 'text-red-400';
    return (
      <p className={`text-sm mt-4 pt-4 border-t border-gray-800 ${gainColor}`}>
        {fmtLocal(totalGain, gainCurrency)} unrealised gains
      </p>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
        <p className="text-gray-500 text-xs mt-1">{t(subtitleKey)}</p>
      </div>
      {holdings.length === 0 ? renderEmpty() : renderTable()}
      {renderSummary()}
    </div>
  );
};
