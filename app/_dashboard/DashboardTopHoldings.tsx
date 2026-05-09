'use client';

import { useTranslation } from 'react-i18next';
import { fmtHolding, pct } from '@/lib/format';
import type { Holding } from '@/domains/shared/types';

const TOP_HOLDINGS_COUNT = 5;

type Props = {
  holdings: Holding[];
};

export const DashboardTopHoldings = ({ holdings }: Props) => {
  const { t } = useTranslation();
  const topHoldings = holdings.slice(0, TOP_HOLDINGS_COUNT);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">{t('dashboard.topHoldings.title')}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-gray-800">
            <th className="text-left pb-2">{t('dashboard.topHoldings.name')}</th>
            <th className="text-right pb-2">{t('dashboard.topHoldings.value')}</th>
            <th className="text-right pb-2">{t('dashboard.topHoldings.pnl')}</th>
          </tr>
        </thead>
        <tbody>
          {topHoldings.map((holding) => (
            <tr key={holding.ticker} className="border-b border-gray-800/50">
              <td className="py-2">
                <span className="text-white">{holding.name}</span>
                <span className="text-gray-500 text-xs ml-2">{holding.ticker}</span>
              </td>
              <td className="text-right text-white">
                {fmtHolding(holding.currentValueLocal, holding.currentValueEur, holding.currency)}
              </td>
              <td className={`text-right ${holding.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {pct(holding.pnlPct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {holdings.length > TOP_HOLDINGS_COUNT && (
        <a href="/holdings" className="text-blue-400 hover:underline text-sm mt-3 inline-block">
          {t('dashboard.topHoldings.viewAll', { count: holdings.length })}
        </a>
      )}
    </div>
  );
};
