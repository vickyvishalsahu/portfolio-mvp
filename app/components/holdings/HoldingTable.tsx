'use client';

import { useTranslation } from 'react-i18next';
import { formatEur, formatHolding, formatPercent } from '@/lib/format';
import type { Holding } from '@/domains/shared/types';
import type { SortKey } from '@/domains/portfolio/hooks/useHoldings';
import { SkeletonLoading } from '@/app/components/SkeletonLoading';

type Props = {
  loading?: boolean;
  holdings: Holding[];
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
};

const TYPE_BADGE: Record<string, string> = {
  stock: 'bg-indigo-50 text-indigo-600',
  etf: 'bg-purple-50 text-purple-600',
  mf: 'bg-amber-50 text-amber-600',
  crypto: 'bg-emerald-50 text-emerald-600',
};

export const HoldingTable = ({ loading, holdings, sortKey, sortAsc, onSort }: Props) => {
  const { t } = useTranslation();

  const renderSkeletonRows = () =>
    Array.from({ length: 6 }).map((_, i) => (
      <tr key={i} className="border-b border-slate-50">
        <td className="py-3 pl-1"><SkeletonLoading classNameList="h-4 w-28" /></td>
        <td className="py-3"><SkeletonLoading classNameList="h-3 w-14" /></td>
        <td className="py-3"><SkeletonLoading classNameList="h-5 w-10" /></td>
        <td className="py-3"><SkeletonLoading classNameList="h-4 w-12 ml-auto" /></td>
        <td className="py-3"><SkeletonLoading classNameList="h-4 w-16 ml-auto" /></td>
        <td className="py-3"><SkeletonLoading classNameList="h-4 w-16 ml-auto" /></td>
        <td className="py-3"><SkeletonLoading classNameList="h-4 w-20 ml-auto" /></td>
        <td className="py-3"><SkeletonLoading classNameList="h-4 w-14 ml-auto" /></td>
        <td className="py-3"><SkeletonLoading classNameList="h-3 w-16" /></td>
      </tr>
    ));

  const renderSortHeader = (label: string, field: SortKey) => (
    <th
      className="text-left pb-3 cursor-pointer hover:text-gray-700 transition select-none"
      onClick={() => onSort(field)}
    >
      {label} {sortKey === field ? (sortAsc ? '▲' : '▼') : ''}
    </th>
  );

  const renderHoldingRow = (holding: Holding) => {
    const pnlColorClass = holding.pnlPct >= 0 ? 'text-emerald-600' : 'text-red-500';
    const typeBadgeClass = TYPE_BADGE[holding.assetType] ?? 'bg-slate-100 text-gray-500';
    const quantityFormatted = holding.quantity < 1
      ? holding.quantity.toFixed(6)
      : holding.quantity.toFixed(2);

    return (
      <tr key={holding.ticker} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
        <td className="py-3 pl-1 text-gray-900 font-medium">{holding.name}</td>
        <td className="py-3 text-gray-400 font-mono text-xs">{holding.ticker}</td>
        <td className="py-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadgeClass}`}>
            {holding.assetType}
          </span>
        </td>
        <td className="py-3 text-right text-gray-700">{quantityFormatted}</td>
        <td className="py-3 text-right text-gray-500">
          {formatHolding(holding.avgCostLocal, holding.avgCostEur, holding.currency)}
        </td>
        <td className="py-3 text-right text-gray-700">
          {formatHolding(holding.currentPriceLocal, holding.currentPriceEur, holding.currency)}
        </td>
        <td className="py-3 text-right">
          <div className="text-gray-900 font-medium">
            {formatHolding(holding.currentValueLocal, holding.currentValueEur, holding.currency)}
          </div>
          {holding.currency !== 'EUR' && (
            <div className="text-gray-400 text-xs">{formatEur(holding.currentValueEur)}</div>
          )}
        </td>
        <td className={`py-3 text-right font-medium ${pnlColorClass}`}>
          <div>{formatPercent(holding.pnlPct)}</div>
          <div className="text-xs opacity-70">
            {formatHolding(holding.pnlLocal, holding.pnl, holding.currency)}
          </div>
        </td>
        <td className="py-3 text-gray-400 text-xs">{holding.broker}</td>
      </tr>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-slate-100 text-xs uppercase tracking-wider">
              {renderSortHeader(t('holdings.columns.name'), 'name')}
              <th className="text-left pb-3">{t('holdings.columns.ticker')}</th>
              {renderSortHeader(t('holdings.columns.type'), 'assetType')}
              {renderSortHeader(t('holdings.columns.qty'), 'quantity')}
              <th className="text-right pb-3">{t('holdings.columns.avgCost')}</th>
              <th className="text-right pb-3">{t('holdings.columns.price')}</th>
              {renderSortHeader(t('holdings.columns.value'), 'currentValueEur')}
              {renderSortHeader(t('holdings.columns.pnlPct'), 'pnlPct')}
              {renderSortHeader(t('holdings.columns.broker'), 'broker')}
            </tr>
          </thead>
          <tbody>
            {loading ? renderSkeletonRows() : holdings.map(renderHoldingRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
