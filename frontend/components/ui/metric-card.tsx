import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EnhancedCard, EnhancedCardContent } from './enhanced-card';
import { Badge } from './badge';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  description?: string;
  suffix?: string;
  prefix?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  loading = false,
  onClick,
  className,
  description,
  suffix = '',
  prefix = '',
  color = 'primary',
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (change < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  const getIconBgColor = () => {
    switch (color) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  if (loading) {
    return (
      <EnhancedCard
        variant="glass"
        size="md"
        shadow="lg"
        hover="lift"
        interactive={!!onClick}
        loading={true}
        className={className}
        onClick={onClick}
      >
        <EnhancedCardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              {description && (
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
              )}
            </div>
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </EnhancedCardContent>
      </EnhancedCard>
    );
  }

  return (
    <EnhancedCard
      variant="glass"
      size="md"
      shadow="lg"
      hover="lift"
      interactive={!!onClick}
      className={cn('group', className)}
      onClick={onClick}
    >
      <EnhancedCardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {title}
            </p>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {prefix}{value}{suffix}
              </span>
              {change !== undefined && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'flex items-center space-x-1 text-xs font-medium',
                    getChangeColor()
                  )}
                >
                  {getTrendIcon()}
                  <span>{Math.abs(change)}%</span>
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <div
            className={cn(
              'p-3 rounded-xl transition-all duration-200 group-hover:scale-110',
              getIconBgColor()
            )}
          >
            {icon}
          </div>
        </div>
      </EnhancedCardContent>
    </EnhancedCard>
  );
};

export default MetricCard;
