'use client';

import { SkeletonLoading } from '@/app/components/SkeletonLoading';

export const DashboardLoading = () => {

  return (
    <div>
      <div className="h-8 w-36 bg-slate-200 rounded-xl animate-pulse mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SkeletonLoading classNameList="h-28" />
        <SkeletonLoading classNameList="h-28" />
        <SkeletonLoading classNameList="h-28" />
        <SkeletonLoading classNameList="h-28" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <SkeletonLoading classNameList="h-72 lg:col-span-2" />
        <SkeletonLoading classNameList="h-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonLoading classNameList="h-64 lg:col-span-2" />
        <SkeletonLoading classNameList="h-64" />
      </div>
    </div>
  );
};
