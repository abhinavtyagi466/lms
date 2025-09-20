import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Progress Overview */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </div>
          </div>

          {/* Platform Analytics */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-8 h-8 rounded" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 shadow-lg">
            <Skeleton className="h-6 w-40 mb-4 bg-white/20" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="w-2 h-2 rounded-full bg-white/30" />
                  <Skeleton className="h-4 w-full bg-white/20" />
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-end justify-between p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-8 bg-gray-300 dark:bg-gray-600"
            style={{ height: `${Math.random() * 100 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export { Skeleton };
