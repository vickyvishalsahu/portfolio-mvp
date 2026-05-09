'use client';

import { useTranslation } from 'react-i18next';
import { fmtEur, fmtHolding, pct } from '@/lib/format';
import type { Holding } from '@/domains/shared/types';
import type { SortKey } from '@/domains/portfolio/hooks/useHoldings';

type Props = {
  holdings: Holding[];
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
};

const TYPE_BADGE: Record<string, string> = {
  stock: 'bg-blue-900 text-blue-300',
  etf: 'bg-purple-900 text-purple-300',
  mf: 'bg-amber-900 text-amber-300',
  crypto: 'bg-emerald-900 text-emerald-300',
};

export const HoldingTable = ({ holdings, sortKey, sortAsc, onSort }: Props) => {
  const { t } = useTranslation();

  const renderSortHeader = (label: string, field: SortKey) => (
    <th
      className="text-left pb-3 cursor-pointer hover:text-white transition select-none"
      onClick={() => onSort(field)}
    >
      {label} {sortKey === field ? (sortAsc ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800 text-xs uppercase tracking-wider">
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
            {holdings.map((holding) => (
              <tr key={holding.ticker} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                <td className="py-3 pl-1 text-white font-medium">{holding.name}</td>
                <td className="py-3 text-gray-400 font-mono text-xs">{holding.ticker}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${TYPE_BADGE[holding.assetType] ?? 'bg-gray-800 text-gray-400'}`}>
                    {holding.assetType}
                  </span>
                </td>
                <td className="py-3 text-right text-gray-300">
                  {holding.quantity < 1 ? holding.quantity.toFixed(6) : holding.quantity.toFixed(2)}
                </td>
                <td className="py-3 text-right text-gray-400">
                  {fmtHolding(holding.avgCostLocal, holding.avgCostEur, holding.currency)}
                </td>
                <td className="py-3 text-right text-gray-300">
                  {fmtHolding(holding.currentPriceLocal, holding.currentPriceEur, holding.currency)}
                </td>
                <td className="py-3 text-right">
                  <div className="text-white font-medium">
                    {fmtHolding(holding.currentValueLocal, holding.currentValueEur, holding.currency)}
                  </div>
                  {holding.currency !== 'EUR' && (
                    <div className="text-gray-600 text-xs">{fmtEur(holding.currentValueEur)}</div>
                  )}
                </td>
                <td className={`py-3 text-right font-medium ${holding.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <div>{pct(holding.pnlPct)}</div>
                  <div className="text-xs opacity-70">
                    {fmtHolding(holding.pnlLocal, holding.pnl, holding.currency)}
                  </div>
                </td>
                <td className="py-3 text-gray-500 text-xs">{holding.broker}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
