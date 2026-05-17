'use client';

import { useTranslation } from 'react-i18next';
import { SkeletonLoading } from '@/app/components/SkeletonLoading';

export const DashboardLoading = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SkeletonLoading classNameList="h-28" />
        <SkeletonLoading classNameList="h-28" />
        <SkeletonLoading classNameList="h-28" />
        <SkeletonLoading classNameList="h-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SkeletonLoading classNameList="h-72" />
        <SkeletonLoading classNameList="h-72" />
      </div>
      <SkeletonLoading classNameList="h-48 mb-8" />
      <SkeletonLoading classNameList="h-64" />
    </div>
  );
};
