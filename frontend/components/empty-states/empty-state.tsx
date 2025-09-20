import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { 
  FileX, 
  Search, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw,
  Plus,
  BookOpen,
  Users,
  BarChart3
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      <div className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className="min-w-[120px]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

// No Data State
export const NoDataState: React.FC<{
  title?: string;
  description?: string;
  action?: EmptyStateProps['action'];
  className?: string;
}> = ({
  title = 'No data available',
  description = 'There is no data to display at the moment.',
  action,
  className,
}) => {
  return (
    <EmptyState
      icon={<FileX className="w-full h-full" />}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
};

// Search Empty State
export const SearchEmptyState: React.FC<{
  query?: string;
  onClearSearch?: () => void;
  className?: string;
}> = ({
  query,
  onClearSearch,
  className,
}) => {
  return (
    <EmptyState
      icon={<Search className="w-full h-full" />}
      title={query ? `No results for "${query}"` : 'No search results'}
      description={query 
        ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
        : 'Start typing to search for content.'
      }
      action={onClearSearch ? {
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'outline',
      } : undefined}
      className={className}
    />
  );
};

// Offline State
export const OfflineState: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({
  onRetry,
  className,
}) => {
  return (
    <EmptyState
      icon={<WifiOff className="w-full h-full" />}
      title="You're offline"
      description="Please check your internet connection and try again."
      action={onRetry ? {
        label: 'Retry',
        onClick: onRetry,
        variant: 'default',
      } : undefined}
      className={className}
    />
  );
};

// Error State
export const ErrorState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = 'Something went wrong',
  description = 'We encountered an error while loading the data. Please try again.',
  onRetry,
  className,
}) => {
  return (
    <EmptyState
      icon={<AlertTriangle className="w-full h-full" />}
      title={title}
      description={description}
      action={onRetry ? {
        label: 'Try Again',
        onClick: onRetry,
        variant: 'default',
      } : undefined}
      className={className}
    />
  );
};

// Loading Error State
export const LoadingErrorState: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({
  onRetry,
  className,
}) => {
  return (
    <EmptyState
      icon={<RefreshCw className="w-full h-full" />}
      title="Failed to load"
      description="We couldn't load the data. This might be a temporary issue."
      action={onRetry ? {
        label: 'Retry',
        onClick: onRetry,
        variant: 'default',
      } : undefined}
      className={className}
    />
  );
};

// Module Empty State
export const ModuleEmptyState: React.FC<{
  onAddModule?: () => void;
  className?: string;
}> = ({
  onAddModule,
  className,
}) => {
  return (
    <EmptyState
      icon={<BookOpen className="w-full h-full" />}
      title="No modules available"
      description="Get started by creating your first training module."
      action={onAddModule ? {
        label: 'Add Module',
        onClick: onAddModule,
        variant: 'default',
      } : undefined}
      className={className}
    />
  );
};

// User Empty State
export const UserEmptyState: React.FC<{
  onAddUser?: () => void;
  className?: string;
}> = ({
  onAddUser,
  className,
}) => {
  return (
    <EmptyState
      icon={<Users className="w-full h-full" />}
      title="No users found"
      description="Start by adding users to your platform."
      action={onAddUser ? {
        label: 'Add User',
        onClick: onAddUser,
        variant: 'default',
      } : undefined}
      className={className}
    />
  );
};

// Analytics Empty State
export const AnalyticsEmptyState: React.FC<{
  className?: string;
}> = ({
  className,
}) => {
  return (
    <EmptyState
      icon={<BarChart3 className="w-full h-full" />}
      title="No analytics data"
      description="Analytics data will appear here once users start interacting with the platform."
      className={className}
    />
  );
};

export default EmptyState;
