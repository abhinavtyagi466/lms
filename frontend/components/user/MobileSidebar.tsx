import React from 'react';
import { X, Home, BookOpen, BarChart3, User, Mail, Bell, Award, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
    const { user, setCurrentPage, logout } = useAuth();

    const menuItems = [
        { icon: Home, label: 'Dashboard', page: 'dashboard', badge: null },
        { icon: BookOpen, label: 'My Modules', page: 'modules', badge: null },
        { icon: BarChart3, label: 'Performance', page: 'performance', badge: null },
        { icon: Award, label: 'Achievements', page: 'achievements', badge: null },
        { icon: Bell, label: 'Notifications', page: 'notifications', badge: '3' },
        { icon: Mail, label: 'Messages', page: 'messages', badge: null },
        { icon: User, label: 'Profile', page: 'profile', badge: null },
        { icon: Settings, label: 'Settings', page: 'settings', badge: null },
    ];

    const handleNavigation = (page: string) => {
        setCurrentPage(page);
        onClose();
    };

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {user?.name || 'User'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Field Executive</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.page}
                            onClick={() => handleNavigation(item.page)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200 group"
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                    {item.label}
                                </span>
                            </div>
                            {item.badge && (
                                <Badge variant="destructive" className="text-xs">
                                    {item.badge}
                                </Badge>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </Button>
                </div>
            </div>
        </>
    );
};
