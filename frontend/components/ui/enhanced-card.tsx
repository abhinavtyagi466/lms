import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'relative overflow-hidden transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50',
        glass: 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-white/20 dark:border-gray-700/30',
        elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        gradient: 'bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm hover:shadow-md',
        md: 'shadow-md hover:shadow-lg',
        lg: 'shadow-lg hover:shadow-xl',
        xl: 'shadow-xl hover:shadow-2xl',
      },
      hover: {
        none: '',
        lift: 'hover:scale-[1.02] hover:-translate-y-1',
        glow: 'hover:shadow-lg hover:shadow-primary/10',
        both: 'hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10',
      },
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      shadow: 'md',
      hover: 'lift',
      interactive: false,
    },
  }
);

export interface EnhancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const EnhancedCard = React.forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    className, 
    variant, 
    size, 
    shadow, 
    hover, 
    interactive, 
    loading = false,
    disabled = false,
    children, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ 
            variant, 
            size, 
            shadow, 
            hover: disabled ? 'none' : hover, 
            interactive: interactive && !disabled,
            className 
          }),
          disabled && 'opacity-50 cursor-not-allowed',
          loading && 'animate-pulse',
          className
        )}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

// Enhanced Card Header
const EnhancedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
));
EnhancedCardHeader.displayName = 'EnhancedCardHeader';

// Enhanced Card Title
const EnhancedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white',
      className
    )}
    {...props}
  />
));
EnhancedCardTitle.displayName = 'EnhancedCardTitle';

// Enhanced Card Description
const EnhancedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600 dark:text-gray-300', className)}
    {...props}
  />
));
EnhancedCardDescription.displayName = 'EnhancedCardDescription';

// Enhanced Card Content
const EnhancedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
EnhancedCardContent.displayName = 'EnhancedCardContent';

// Enhanced Card Footer
const EnhancedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
));
EnhancedCardFooter.displayName = 'EnhancedCardFooter';

export {
  EnhancedCard,
  EnhancedCardHeader,
  EnhancedCardTitle,
  EnhancedCardDescription,
  EnhancedCardContent,
  EnhancedCardFooter,
};
