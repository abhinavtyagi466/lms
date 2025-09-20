import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';

interface DarkModeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'ghost'
}) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Button
      variant={variant}
      onClick={toggleDarkMode}
      className={`
        ${sizeClasses[size]} 
        ${className}
        relative overflow-hidden
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        ${isDarkMode 
          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/25' 
          : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 shadow-lg shadow-gray-500/25'
        }
        rounded-full border-0
        group
      `}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun Icon */}
        <Sun 
          className={`
            ${iconSizes[size]}
            absolute transition-all duration-500 ease-in-out
            ${isDarkMode 
              ? 'rotate-180 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
            }
            group-hover:rotate-12
          `} 
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`
            ${iconSizes[size]}
            absolute transition-all duration-500 ease-in-out
            ${isDarkMode 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-180 scale-0 opacity-0'
            }
            group-hover:-rotate-12
          `} 
        />
      </div>
      
      {/* Animated background glow */}
      <div 
        className={`
          absolute inset-0 rounded-full opacity-0 group-hover:opacity-20
          transition-opacity duration-300
          ${isDarkMode 
            ? 'bg-gradient-to-r from-yellow-300 to-orange-400' 
            : 'bg-gradient-to-r from-blue-300 to-purple-400'
          }
        `}
      />
    </Button>
  );
};

// Compact version for headers
export const DarkModeToggleCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        ${className}
        relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out
        ${isDarkMode 
          ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
          : 'bg-gradient-to-r from-gray-300 to-gray-400'
        }
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isDarkMode ? 'focus:ring-yellow-500' : 'focus:ring-gray-500'}
        hover:scale-105 active:scale-95
      `}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Toggle circle */}
      <div 
        className={`
          absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg
          transition-transform duration-300 ease-in-out
          ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'}
          flex items-center justify-center
        `}
      >
        {isDarkMode ? (
          <Moon className="w-3 h-3 text-slate-600" />
        ) : (
          <Sun className="w-3 h-3 text-yellow-500" />
        )}
      </div>
    </button>
  );
};
