import React from 'react';
import { GraduationCap, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DarkModeToggle } from './DarkModeToggle';
import { NotificationBell } from './NotificationBell';

interface SidebarItem {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface SidebarProps {
  items: SidebarItem[];
  onItemClick: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, onItemClick }) => {
  const { currentPage, user } = useAuth();
  
  return (
    <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-700 h-screen flex flex-col shadow-xl sticky top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Fe Dashboard</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300">Learning Platform</p>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
        <div className="flex items-center gap-3 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1">
            <NotificationBell />
            <DarkModeToggle size="sm" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
            Navigation
          </h3>
        </div>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => onItemClick(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                  currentPage === item.key 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-gray-900 dark:text-white shadow-lg shadow-green-500/30 border-2 border-green-500 transform scale-[1.02]' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                }`}
              >
                <div className={`p-2 rounded-lg transition-all duration-200 ${
                  currentPage === item.key 
                    ? 'bg-green-200 dark:bg-green-700' 
                    : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                }`}>
                  <item.icon className={`w-5 h-5 ${
                    currentPage === item.key ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                  }`} />
                </div>
                <span className={`font-medium ${
                  currentPage === item.key ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-700 dark:text-gray-300'
                }`}>{item.label}</span>
                {currentPage === item.key && (
                  <div className="ml-auto w-2.5 h-2.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

    </div>
  );
};