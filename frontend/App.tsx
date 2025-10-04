import React, { useState, Suspense, lazy } from 'react';
import { 
  Users, 
  BookOpen, 
  BarChart3,
  Award, 
  FileText, 
  LogOut,
  Home,
  Bell,
  Mail
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Sidebar } from './components/common/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPopup } from './components/common/LoginPopup';
import { LogoutPopup } from './components/common/LogoutPopup';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Toaster } from './components/ui/sonner';

// Lazy load page components for better performance
const UserLogin = lazy(() => import('./pages/user/UserLogin').then(module => ({ default: module.UserLogin })));
const UserRegister = lazy(() => import('./pages/user/UserRegister').then(module => ({ default: module.UserRegister })));
const UserDashboard = lazy(() => import('./pages/user/UserDashboard').then(module => ({ default: module.UserDashboard })));
const TrainingModule = lazy(() => import('./pages/user/TrainingModule').then(module => ({ default: module.TrainingModule })));
const ModulesPage = lazy(() => import('./pages/user/ModulesPage').then(module => ({ default: module.ModulesPage })));
const NotificationsPage = lazy(() => import('./pages/user/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const QuizPage = lazy(() => import('./pages/user/QuizPage').then(module => ({ default: module.QuizPage })));

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(module => ({ default: module.AdminLogin })));
const AdminDashboardEnhanced = lazy(() => import('./pages/admin/AdminDashboardEnhanced').then(module => ({ default: module.AdminDashboardEnhanced })));
const UserManagement = lazy(() => import('./pages/admin/UserManagement').then(module => ({ default: module.UserManagement })));
const UserLifecycle = lazy(() => import('./pages/admin/UserLifecycle').then(module => ({ default: module.UserLifecycle })));
const ModuleManagement = lazy(() => import('./pages/admin/ModuleManagement').then(module => ({ default: module.ModuleManagement })));
const WarningAuditRecord = lazy(() => import('./pages/admin/WarningAuditRecord').then(module => ({ default: module.WarningAuditRecord })));
const AwardsRecognition = lazy(() => import('./pages/admin/AwardsRecognition').then(module => ({ default: module.AwardsRecognition })));
const LifecycleDashboard = lazy(() => import('./pages/admin/LifecycleDashboard').then(module => ({ default: module.LifecycleDashboard })));
const MailPreview = lazy(() => import('./pages/admin/MailPreview').then(module => ({ default: module.MailPreview })));
const KPITriggerDashboard = lazy(() => import('./pages/admin/KPITriggerDashboard').then(module => ({ default: module.KPITriggerDashboard })));
const KPIManualEntry = lazy(() => import('./pages/admin/KPIManualEntry').then(module => ({ default: module.KPIManualEntry })));
const UserDetailsPage = lazy(() => import('./pages/admin/UserDetailsPage').then(module => ({ default: module.UserDetailsPage })));
const KPIScoresPage = lazy(() => import('./pages/admin/KPIScoresPage').then(module => ({ default: module.KPIScoresPage })));
const UserKPIScoresPage = lazy(() => import('./pages/user/KPIScoresPage').then(module => ({ default: module.KPIScoresPage })));
const EmailTemplatesPage = lazy(() => import('./pages/admin/EmailTemplatesPage').then(module => ({ default: module.EmailTemplatesPage })));
const EmailTestingPage = lazy(() => import('./pages/admin/EmailTestingPage').then(module => ({ default: module.EmailTestingPage })));
const KPIConfigurationPage = lazy(() => import('./pages/admin/KPIConfigurationPage').then(module => ({ default: module.KPIConfigurationPage })));
// Temporarily commented out unused components
// const EmailNotificationCenter = lazy(() => import('./pages/admin/EmailNotificationCenter'));
// const AuditManager = lazy(() => import('./pages/admin/AuditSchedulerDashboardV2'));

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
  { key: 'kpi-manual-entry', label: 'KPI Manual Entry', icon: BarChart3 },
  { key: 'kpi-configuration', label: 'KPI Configuration', icon: BarChart3 },
  { key: 'email-templates', label: 'Emails', icon: Mail },
  { key: 'email-testing', label: 'Email Testing', icon: Mail },
  // { key: 'audit-scheduler', label: 'Audit Scheduler', icon: Calendar }, // TEMPORARILY HIDDEN
  // { key: 'email-center', label: 'Email Center', icon: Mail }, // TEMPORARILY HIDDEN
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
      // Check for user-details with userId first
      if (currentPage.startsWith('user-details/')) {
        const userDetailsMatch = currentPage.match(/user-details\/([^\/]+)/);
        if (userDetailsMatch) {
          return <UserDetailsPage userId={userDetailsMatch[1]} />;
        }
        return <UserDetailsPage userId="" />;
      }

      // Check for kpi-scores with userId
      if (currentPage.startsWith('kpi-scores/')) {
        const kpiScoresMatch = currentPage.match(/kpi-scores\/([^\/]+)/);
        if (kpiScoresMatch) {
          return <KPIScoresPage userId={kpiScoresMatch[1]} />;
        }
        return <KPIScoresPage userId="" />;
      }

      switch (currentPage) {
        case 'user-login': return <UserLogin />;
        case 'user-register': return <UserRegister />;
        case 'user-dashboard': return <UserDashboard />;
        case 'modules': return <ModulesPage />;
        case 'training-module': return <TrainingModule />;
        case 'quiz': return <QuizPage />;
        case 'quizzes': return <QuizPage />;
        case 'notifications': return <NotificationsPage />;
        case 'kpi-scores': return <UserKPIScoresPage />;
               case 'admin-login': return <AdminLogin />;
               case 'admin-dashboard': return <AdminDashboardEnhanced />;
               case 'user-management': return <UserManagement />;
               case 'user-lifecycle': return <UserLifecycle />;
               case 'module-management': return <ModuleManagement />;
               case 'kpi-triggers': return <KPITriggerDashboard />;
               case 'kpi-manual-entry': return <KPIManualEntry />;
               case 'kpi-configuration': return <KPIConfigurationPage />;
        case 'email-templates': return <EmailTemplatesPage />;
        case 'email-testing': return <EmailTestingPage />;
        // case 'audit-scheduler': return <AuditManager />; // TEMPORARILY HIDDEN
        // case 'email-center': return <EmailNotificationCenter />; // TEMPORARILY HIDDEN
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
              <Suspense fallback={<LoadingSpinner size="lg" fullScreen={false} text="Loading page..." />}>
                {renderPage()}
              </Suspense>
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
            <Suspense fallback={<LoadingSpinner size="lg" fullScreen={false} text="Loading page..." />}>
              {renderPage()}
            </Suspense>
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
            <Toaster position="top-right" richColors closeButton />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}