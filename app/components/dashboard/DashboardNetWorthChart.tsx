'use client';

import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatLocal } from '@/lib/format';

type Snapshot = { date: string; totalValue: number };

type Props = {
  snapshots: Snapshot[];
  primaryCurrency: string;
};

export const DashboardNetWorthChart = ({ snapshots, primaryCurrency }: Props) => {
  const { t } = useTranslation();

  const formatTickDate = (dateString: string) => {
    const [, month, day] = dateString.split('-');
    return `${day}/${month}`;
  };

  const formatTickValue = (value: number) => formatLocal(value, primaryCurrency);

  const formatTooltipValue = (value: unknown) => [
    formatLocal(Number(value), primaryCurrency),
    t('dashboard.netWorth.portfolio'),
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
      <h2 className="text-base font-semibold text-gray-900 mb-4">{t('dashboard.netWorth.title')}</h2>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={snapshots} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={formatTickDate}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={formatTickValue}
            width={72}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={formatTooltipValue}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
            }}
            labelStyle={{ color: '#374151', fontSize: 12 }}
            itemStyle={{ color: '#6366f1', fontSize: 12 }}
          />
          <Area
            type="monotone"
            dataKey="totalValue"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#netWorthGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
