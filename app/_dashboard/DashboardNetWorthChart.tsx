'use client';

import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtLocal } from '@/lib/format';

type Snapshot = { date: string; totalValue: number };

type Props = {
  snapshots: Snapshot[];
  primaryCurrency: string;
};

export const DashboardNetWorthChart = ({ snapshots, primaryCurrency }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">{t('dashboard.netWorth.title')}</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={snapshots} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(dateString) => {
              const [, month, day] = dateString.split('-');
              return `${day}/${month}`;
            }}
          />
          <YAxis
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(value) => fmtLocal(value, primaryCurrency)}
            width={64}
          />
          <Tooltip
            formatter={(value: any) => [fmtLocal(Number(value), primaryCurrency), t('dashboard.netWorth.portfolio')]}
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#e5e7eb' }}
            itemStyle={{ color: '#3b82f6' }}
          />
          <Line
            type="monotone"
            dataKey="totalValue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
