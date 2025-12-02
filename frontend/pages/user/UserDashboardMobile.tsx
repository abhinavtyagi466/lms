// Mobile-Friendly User Dashboard Wrapper
// This file adds mobile sidebar functionality to the existing UserDashboard
// Import this instead of the original UserDashboard for mobile-friendly version

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { MobileSidebar } from '../../components/user/MobileSidebar';
import { UserDashboard as OriginalUserDashboard } from './UserDashboard';

export const UserDashboardMobile: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="relative min-h-screen">
            {/* Mobile Sidebar */}
            <MobileSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Hamburger Menu Button - Fixed Position on Mobile */}
            <div className="lg:hidden fixed top-4 left-4 z-30">
                <Button
                    onClick={() => setIsSidebarOpen(true)}
                    variant="outline"
                    size="icon"
                    className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-200"
                >
                    <Menu className="w-5 h-5" />
                </Button>
            </div>

            {/* Original Dashboard Content */}
            <div className="w-full">
                <OriginalUserDashboard />
            </div>
        </div>
    );
};

// Export as default for easy replacement
export default UserDashboardMobile;
