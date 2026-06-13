'use client';

import { useTranslation } from 'react-i18next';
import { formatHolding, formatPercent } from '@/lib/format';
import type { Holding } from '@/domains/shared/types';

const TOP_HOLDINGS_COUNT = 5;

type AssetBadgeConfig = { bg: string; text: string; label: string };

const ASSET_BADGE: Record<string, AssetBadgeConfig> = {
  stock: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Stock' },
  etf: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'ETF' },
  mf: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'MF' },
  crypto: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Crypto' },
};

const DEFAULT_BADGE: AssetBadgeConfig = { bg: 'bg-gray-50', text: 'text-gray-600', label: '—' };

type Props = {
  holdings: Holding[];
};

export const DashboardTopHoldings = ({ holdings }: Props) => {
  const { t } = useTranslation();
  const topHoldings = holdings.slice(0, TOP_HOLDINGS_COUNT);

  const renderRow = (holding: Holding) => {
    const badge = ASSET_BADGE[holding.assetType] ?? DEFAULT_BADGE;
    const pnlBadgeClass = holding.pnl >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500';

    return (
      <tr key={holding.ticker} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
        <td className="py-3 pr-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
            <div className="min-w-0">
              <span className="text-sm font-medium text-gray-900">{holding.name}</span>
              <span className="text-xs text-gray-400 ml-2">{holding.ticker}</span>
            </div>
          </div>
        </td>
        <td className="py-3 text-right text-sm text-gray-900 whitespace-nowrap">
          {formatHolding(holding.currentValueLocal, holding.currentValueEur, holding.currency)}
        </td>
        <td className="py-3 pl-4 text-right whitespace-nowrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pnlBadgeClass}`}>
            {formatPercent(holding.pnlPct)}
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{t('dashboard.topHoldings.title')}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.topHoldings.name')}
            </th>
            <th className="text-right pb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.topHoldings.value')}
            </th>
            <th className="text-right pb-3 pl-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
              {t('dashboard.topHoldings.pnl')}
            </th>
          </tr>
        </thead>
        <tbody>{topHoldings.map(renderRow)}</tbody>
      </table>
      {holdings.length > TOP_HOLDINGS_COUNT && (
        <a href="/holdings" className="text-indigo-600 hover:text-indigo-700 text-sm mt-4 inline-block font-medium">
          {t('dashboard.topHoldings.viewAll', { count: holdings.length })} →
        </a>
      )}
    </div>
  );
};
