'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatLocal } from '@/lib/format';
import type { Holding } from '@/domains/shared/types';

const ASSET_COLORS: Record<string, string> = {
  stock: '#6366f1',
  etf: '#8b5cf6',
  mf: '#f59e0b',
  crypto: '#10b981',
};

const BROKER_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

type Props = {
  holdings: Holding[];
  brokerAllocation: Record<string, number>;
  primaryCurrency: string;
};

export const DashboardAllocationChart = ({ holdings, brokerAllocation, primaryCurrency }: Props) => {
  const { t } = useTranslation();
  const [allocView, setAllocView] = useState<'type' | 'broker'>('type');

  const allocationByType = Object.entries(
    holdings.reduce<Record<string, number>>((accumulator, holding) => {
      accumulator[holding.assetType] = (accumulator[holding.assetType] || 0) + holding.currentValueLocal;
      return accumulator;
    }, {})
  ).map(([type, value]) => ({
    name: t(`dashboard.assetLabels.${type}`, { defaultValue: type }),
    value: Math.round(value * 100) / 100,
    color: ASSET_COLORS[type] ?? '#6b7280',
  }));

  const allocationByBroker = Object.entries(brokerAllocation).map(([broker, value], colorIndex) => ({
    name: broker,
    value: Math.round(value * 100) / 100,
    color: BROKER_COLORS[colorIndex % BROKER_COLORS.length],
  }));

  const allocationData = allocView === 'type' ? allocationByType : allocationByBroker;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">{t('dashboard.allocation.title')}</h2>
        <div className="flex text-xs rounded-lg overflow-hidden border border-slate-200">
          <button
            onClick={() => setAllocView('type')}
            className={`px-3 py-1.5 transition ${allocView === 'type' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('dashboard.allocation.byType')}
          </button>
          <button
            onClick={() => setAllocView('broker')}
            className={`px-3 py-1.5 transition ${allocView === 'broker' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('dashboard.allocation.byBroker')}
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={allocationData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={95}
            innerRadius={55}
            paddingAngle={2}
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name ?? ''} ${(((percent ?? 0) * 100).toFixed(0))}%`
            }
          >
            {allocationData.map((entry, colorIndex) => (
              <Cell key={colorIndex} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => formatLocal(Number(value), primaryCurrency)}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
            }}
            labelStyle={{ color: '#374151', fontSize: 12 }}
            itemStyle={{ color: '#374151', fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
