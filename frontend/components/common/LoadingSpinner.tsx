import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'default', 
  text = 'Loading...',
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-12 h-12'
  };

  const containerClasses = fullScreen 
    ? 'min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center p-8';

  const spinnerClasses = `${sizeClasses[size]} animate-spin text-blue-600`;
  
  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Main spinner */}
        <Loader2 className={spinnerClasses} />
        
        {/* Pulsing ring effect */}
        <div className={`absolute inset-0 rounded-full border-2 border-blue-200 animate-pulse ${
          size === 'sm' ? 'border-2' : size === 'default' ? 'border-3' : 'border-4'
        }`}></div>
        
        {/* Outer ring */}
        <div className={`absolute inset-0 rounded-full border border-blue-300/50 ${
          size === 'sm' ? '-inset-1' : size === 'default' ? '-inset-2' : '-inset-4'
        }`}></div>
      </div>
      
      {text && (
        <div className="mt-4 text-center">
          <p className="text-gray-600 font-medium">{text}</p>
          <div className="flex items-center justify-center mt-2 space-x-1">
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};