'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtLocal } from '@/lib/format';
import type { Holding } from '@/domains/shared/types';

const ASSET_COLORS: Record<string, string> = {
  stock: '#3b82f6',
  etf: '#8b5cf6',
  mf: '#f59e0b',
  crypto: '#10b981',
};

const BROKER_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

type Props = {
  holdings: Holding[];
  brokerAllocation: Record<string, number>;
  primaryCurrency: string;
};

export const DashboardAllocationChart = ({ holdings, brokerAllocation, primaryCurrency }: Props) => {
  const { t } = useTranslation();
  const [allocView, setAllocView] = useState<'type' | 'broker'>('type');

  const allocationByType = Object.entries(
    holdings.reduce<Record<string, number>>((acc, holding) => {
      acc[holding.assetType] = (acc[holding.assetType] || 0) + holding.currentValueLocal;
      return acc;
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
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t('dashboard.allocation.title')}</h2>
        <div className="flex text-xs rounded overflow-hidden border border-gray-700">
          <button
            onClick={() => setAllocView('type')}
            className={`px-3 py-1 transition ${allocView === 'type' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t('dashboard.allocation.byType')}
          </button>
          <button
            onClick={() => setAllocView('broker')}
            className={`px-3 py-1 transition ${allocView === 'broker' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t('dashboard.allocation.byBroker')}
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={allocationData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            paddingAngle={2}
            label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {allocationData.map((entry, colorIndex) => (
              <Cell key={colorIndex} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => fmtLocal(Number(value), primaryCurrency)}
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#e5e7eb' }}
            itemStyle={{ color: '#e5e7eb' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
