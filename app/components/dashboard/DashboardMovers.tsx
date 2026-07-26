'use client';

import { useTranslation } from 'react-i18next';
import { formatLocal } from '@/lib/format';
import { computeMovers } from '@/domains/portfolio/movers';
import type { MoverItem } from '@/domains/portfolio/movers';
import type { Holding } from '@/domains/shared/types';

type Props = {
  holdings: Holding[];
};

export const DashboardMovers = ({ holdings }: Props) => {
  const { t } = useTranslation();

  const movers = computeMovers(holdings);

  if (movers.length === 0) return null;

  const renderMoverItem = (mover: MoverItem) => {
    const isGain = mover.direction === 'gain';
    const dotClass = isGain ? 'bg-emerald-400' : 'bg-red-400';
    const changeClass = isGain ? 'text-emerald-600' : 'text-red-500';
    const changeSign = isGain ? '+' : '';
    const changeText = `${changeSign}${formatLocal(mover.change, mover.currency)}`;
    const changePctText = `${changeSign}${mover.changePct.toFixed(1)}%`;

    return (
      <div key={mover.ticker} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{mover.name}</p>
          <p className="text-xs text-gray-400">{mover.ticker}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${changeClass}`}>{changeText}</p>
          <p className={`text-xs ${changeClass}`}>{changePctText}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
      <h2 className="text-base font-semibold text-gray-900 mb-1">{t('dashboard.movers.title')}</h2>
      <p className="text-xs text-gray-400 mb-4">{t('dashboard.movers.sinceLastRefresh')}</p>
      <div>{movers.map(renderMoverItem)}</div>
    </div>
  );
};
