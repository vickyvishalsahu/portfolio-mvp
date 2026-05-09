'use client';

import { useTranslation } from 'react-i18next';
import { fmtLocal } from '@/lib/format';
import type { Holding } from '@/domains/shared/types';

const TOP_MOVERS_COUNT = 3;

type HoldingWithChange = Holding & { change: number; changePct: number };

type Props = {
  holdings: Holding[];
};

export const DashboardMovers = ({ holdings }: Props) => {
  const { t } = useTranslation();

  const withChange = holdings
    .filter((holding) => holding.prevValueLocal !== null)
    .map((holding) => ({
      ...holding,
      change: holding.currentValueLocal - holding.prevValueLocal!,
      changePct: ((holding.currentValueLocal - holding.prevValueLocal!) / holding.prevValueLocal!) * 100,
    }))
    .sort((holdingA, holdingB) => holdingB.change - holdingA.change);

  const topGainers = withChange.slice(0, TOP_MOVERS_COUNT);
  const topLosers = [...withChange].reverse().slice(0, TOP_MOVERS_COUNT).filter((holding) => holding.change < 0);

  if (withChange.length === 0) return null;

  const renderGainers = () => {
    if (topGainers.length === 0) return <p className="text-gray-600 text-sm">{t('dashboard.movers.noGains')}</p>;
    return (
      <table className="w-full text-sm">
        <tbody>
          {topGainers.map((holding) => (
            <tr key={holding.ticker} className="border-b border-gray-800/50">
              <td className="py-2">
                <span className="text-white">{holding.name}</span>
                <span className="text-gray-500 text-xs ml-2">{holding.ticker}</span>
              </td>
              <td className="text-right text-green-400 font-medium">+{fmtLocal(holding.change, holding.currency)}</td>
              <td className="text-right text-green-500 text-xs w-16">+{holding.changePct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderLosers = () => {
    if (topLosers.length === 0) return <p className="text-gray-600 text-sm">{t('dashboard.movers.noLosses')}</p>;
    return (
      <table className="w-full text-sm">
        <tbody>
          {topLosers.map((holding) => (
            <tr key={holding.ticker} className="border-b border-gray-800/50">
              <td className="py-2">
                <span className="text-white">{holding.name}</span>
                <span className="text-gray-500 text-xs ml-2">{holding.ticker}</span>
              </td>
              <td className="text-right text-red-400 font-medium">{fmtLocal(holding.change, holding.currency)}</td>
              <td className="text-right text-red-500 text-xs w-16">{holding.changePct.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">{t('dashboard.movers.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.movers.gainers')}</p>
          {renderGainers()}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.movers.losers')}</p>
          {renderLosers()}
        </div>
      </div>
    </div>
  );
};
