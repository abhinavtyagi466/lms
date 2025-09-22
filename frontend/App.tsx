import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  BarChart3,
  Award, 
  FileText, 
  LogOut,
  Home,
  Bell,
  Mail,
  Calendar
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Sidebar } from './components/common/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPopup } from './components/common/LoginPopup';
import { LogoutPopup } from './components/common/LogoutPopup';

// Import page components
import { UserLogin } from './pages/user/UserLogin';
import { UserRegister } from './pages/user/UserRegister';
import { UserDashboard } from './pages/user/UserDashboard';
import { TrainingModule } from './pages/user/TrainingModule';
import { ModulesPage } from './pages/user/ModulesPage';

import { NotificationsPage } from './pages/user/NotificationsPage';
import { QuizPage } from './pages/user/QuizPage';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboardEnhanced } from './pages/admin/AdminDashboardEnhanced';
import { UserManagement } from './pages/admin/UserManagement';
import { ModuleManagement } from './pages/admin/ModuleManagement';

import { WarningAuditRecord } from './pages/admin/WarningAuditRecord';
import { AwardsRecognition } from './pages/admin/AwardsRecognition';
import { LifecycleDashboard } from './pages/admin/LifecycleDashboard';
import { MailPreview } from './pages/admin/MailPreview';
import { KPITriggers } from './pages/admin/KPITriggers';
import EmailNotificationCenter from './pages/admin/EmailNotificationCenter';
import AuditManager from './pages/admin/AuditSchedulerDashboardV2';

// Navigation items
const userSidebarItems = [
  { key: 'user-dashboard', label: 'Dashboard', icon: Home },
  { key: 'modules', label: 'Modules', icon: BookOpen },
  // { key: 'quizzes', label: 'Quizzes', icon: FileQuestion },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'logout', label: 'Logout', icon: LogOut }
];

const adminSidebarItems = [
  { key: 'admin-dashboard', label: 'Dashboard', icon: Home },
  { key: 'user-management', label: 'User Management', icon: Users },
  { key: 'module-management', label: 'Module Management', icon: BookOpen },
  { key: 'kpi-triggers', label: 'KPI Triggers', icon: BarChart3 },
  { key: 'audit-scheduler', label: 'Audit Scheduler', icon: Calendar },
  { key: 'email-center', label: 'Email Center', icon: Mail },
  { key: 'warnings-audit', label: 'Audit / Warnings', icon: FileText },
  { key: 'awards', label: 'Awards / Recognition', icon: Award },
  // { key: 'lifecycle', label: 'Lifecycle Dashboard', icon: Clock },
  // { key: 'mail-preview', label: 'Mail Preview', icon: Mail },
  { key: 'logout', label: 'Logout', icon: LogOut }
];



// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page to try again</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main app content component
const AppContent: React.FC = () => {
  try {
    const { user, userType, currentPage, setCurrentPage, logout, loading, login } = useAuth();
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    // Show loading spinner while auth is being checked
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    const handleLoginPopup = async (email: string, password: string, userType: 'user' | 'admin') => {
      setLoginLoading(true);
      setLoginError(null);
      try {
        await login(email, password, userType);
        setShowLoginPopup(false);
      } catch (error: any) {
        setLoginError(error.message || 'Login failed');
      } finally {
        setLoginLoading(false);
      }
    };

    const handleLogoutPopup = async () => {
      setLogoutLoading(true);
      try {
        await logout();
        setShowLogoutPopup(false);
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        setLogoutLoading(false);
      }
    };

    const handleNavigation = (page: string) => {
      if (page === 'logout') {
        setShowLogoutPopup(true);
      } else if (page === 'my-modules') {
        setCurrentPage('training-module');
      } else {
        setCurrentPage(page);
      }
    };

    const renderPage = () => {
      switch (currentPage) {
        case 'user-login': return <UserLogin />;
        case 'user-register': return <UserRegister />;
        case 'user-dashboard': return <UserDashboard />;
        case 'modules': return <ModulesPage />;
        case 'training-module': return <TrainingModule />;
        case 'quiz': return <QuizPage />;
        case 'quizzes': return <QuizPage />;
        case 'notifications': return <NotificationsPage />;
        case 'admin-login': return <AdminLogin />;
        case 'admin-dashboard': return <AdminDashboardEnhanced />;
        case 'user-management': return <UserManagement />;
        case 'module-management': return <ModuleManagement />;
        case 'kpi-triggers': return <KPITriggers />;
        case 'audit-scheduler': return <AuditManager />;
        case 'email-center': return <EmailNotificationCenter />;
        case 'warnings-audit': return <WarningAuditRecord />;
        case 'awards': return <AwardsRecognition />;
        case 'lifecycle': return <LifecycleDashboard />;
        case 'mail-preview': return <MailPreview />;
        default: return <UserLogin />;
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">

        {user ? (
          <div className="flex">
            <Sidebar 
              items={userType === 'user' ? userSidebarItems : adminSidebarItems}
              onItemClick={handleNavigation}
            />
            <div className="flex-1 overflow-auto">
              {renderPage()}
            </div>
          </div>
        ) : (
          <div>
            {currentPage === 'user-login' && (
              <div className="fixed top-4 right-20 z-10 flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage('admin-login')}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Admin Login
                </Button>
              </div>
            )}
            {currentPage === 'admin-login' && (
              <div className="fixed top-4 right-20 z-10 flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage('user-login')}
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  User Login
                </Button>
              </div>
            )}
            {renderPage()}
          </div>
        )}

        {/* Login Popup */}
        <LoginPopup
          isOpen={showLoginPopup}
          onClose={() => {
            setShowLoginPopup(false);
            setLoginError(null);
          }}
          onLogin={handleLoginPopup}
          loading={loginLoading}
          error={loginError}
        />

        {/* Logout Popup */}
        <LogoutPopup
          isOpen={showLogoutPopup}
          onClose={() => setShowLogoutPopup(false)}
          onLogout={handleLogoutPopup}
          loading={logoutLoading}
          userName={user?.name}
        />
      </div>
    );
  } catch (error) {
    console.error('AppContent: Error occurred', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600 mb-4">There was an issue with the authentication system.</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
};

// Main App Component
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}