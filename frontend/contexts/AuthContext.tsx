import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/apiService';
import { toast } from 'sonner';

// API Response interfaces
interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}

// Authentication Context
interface User {
  id: string;
  name: string;
  email: string;
  userType: 'user' | 'admin' | 'hr' | 'manager' | 'hod';
  employeeId?: string;
  department?: string;
  status?: string;
  kpiScore?: number;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  userType: 'user' | 'admin' | 'hr' | 'manager' | 'hod' | null;
  loading: boolean;
  login: (email: string, password: string, type: 'user' | 'admin') => Promise<void>;
  logout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  selectedModuleId: string | null;
  setSelectedModuleId: (moduleId: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth called outside of AuthProvider');
    console.trace('useAuth stack trace');
    throw new Error('useAuth must be used within AuthProvider. Make sure your component is wrapped with AuthProvider.');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('AuthProvider: Starting initialization');

  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'user' | 'admin' | 'hr' | 'manager' | 'hod' | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const savedPage = localStorage.getItem('currentPage');
    return hash || savedPage || 'user-login';
  });
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage) {
        const adminPages = [
          'admin-dashboard', 'user-management', 'exit-records', 'user-lifecycle',
          'module-management', 'score-reports', 'kpi-triggers', 'kpi-audit-dashboard',
          'kpi-configuration', 'email-templates', 'warnings-audit', 'awards',
          'lifecycle', 'mail-preview'
        ];
        const userPages = [
          'user-dashboard', 'user-profile', 'modules', 'training-module',
          'quiz', 'quizzes', 'notifications', 'kpi-scores'
        ];

        if ((adminPages.includes(hash) || hash.startsWith('user-details/') || hash.startsWith('kpi-scores/')) && !user) {
          setCurrentPage('admin-login');
          window.location.hash = 'admin-login';
          return;
        }
        if (userPages.includes(hash) && !user) {
          setCurrentPage('user-login');
          window.location.hash = 'user-login';
          return;
        }
        if (adminPages.includes(hash) && user && userType !== 'admin' && userType !== 'hr' && userType !== 'manager' && userType !== 'hod') {
          setCurrentPage('user-login');
          window.location.hash = 'user-login';
          return;
        }
        if (userPages.includes(hash) && user && userType !== 'user') {
          setCurrentPage('admin-login');
          window.location.hash = 'admin-login';
          return;
        }
        setCurrentPage(hash);
        localStorage.setItem('currentPage', hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    if (currentPage && currentPage !== 'user-login' && currentPage !== 'admin-login') {
      localStorage.setItem('currentPage', currentPage);
      if (window.location.hash !== `#${currentPage}`) {
        window.location.hash = currentPage;
      }
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentPage, user, userType]);

  // Check for existing auth token on app load
  useEffect(() => {
    console.log('AuthProvider: useEffect triggered');
    const checkAuthStatus = async () => {
      console.log('AuthProvider: checkAuthStatus started');
      try {
        const token = localStorage.getItem('authToken');
        console.log('AuthProvider: Token found:', !!token);
        if (token) {
          try {
            console.log('AuthProvider: Validating token with getMe API');
            const response = await apiService.auth.getMe() as unknown as AuthResponse;
            console.log('AuthProvider: getMe response:', response);
            if (response && response.success && response.user) {
              console.log('AuthProvider: Token valid, setting user state');
              setUser(response.user);
              setUserType(response.user.userType);
              const currentHash = window.location.hash.replace('#', '');
              const savedPage = localStorage.getItem('currentPage');
              if (!currentHash && !savedPage) {
                const defaultPage = response.user.userType === 'user' ? 'user-dashboard' : 'admin-dashboard';
                setCurrentPage(defaultPage);
                console.log('AuthProvider: Set default page to:', defaultPage);
              } else if (savedPage && !currentHash) {
                setCurrentPage(savedPage);
                console.log('AuthProvider: Using saved page:', savedPage);
              }
              console.log('AuthProvider: User authenticated successfully');
            } else {
              console.log('AuthProvider: Invalid response, clearing token');
              localStorage.removeItem('authToken');
              setUser(null);
              setUserType(null);
            }
          } catch (authError) {
            console.error('AuthProvider: getMe failed:', authError);
            localStorage.removeItem('authToken');
            setUser(null);
            setUserType(null);
          }
        } else {
          console.log('AuthProvider: No token found');
          localStorage.removeItem('currentPage');
        }
      } catch (error) {
        console.error('AuthProvider: Token validation failed:', error);
        if (error instanceof Error && error.message.includes('Backend server is not running')) {
          console.log('AuthProvider: Backend not running, keeping token');
          return;
        }
        localStorage.removeItem('authToken');
        setUser(null);
        setUserType(null);
      } finally {
        console.log('AuthProvider: Setting loading to false');
        setLoading(false);
        setInitialized(true);
      }
    };

    // IMPORTANT: Ignore auth-failed events when on login page
    const handleAuthFailed = () => {
      const isOnLoginPage = window.location.hash.includes('login');
      if (isOnLoginPage) {
        console.log('AuthProvider: Auth failed ignored - on login page');
        return;
      }
      console.log('AuthProvider: Auth failed event received');
      setUser(null);
      setUserType(null);
      setCurrentPage('user-login');
    };

    window.addEventListener('auth-failed', handleAuthFailed);
    checkAuthStatus();

    return () => {
      window.removeEventListener('auth-failed', handleAuthFailed);
    };
  }, []);

  // LOGIN FUNCTION - NO setLoading here to prevent unmounting login form
  const login = async (email: string, password: string, type: 'user' | 'admin') => {
    // Don't set loading=true! AdminLogin has its own loading state.
    // Setting loading here causes AuthProvider to show loading spinner and unmount the login form!
    try {
      console.log('AuthProvider: Starting login for:', email, type);
      const response = await apiService.auth.login(email, password, type) as unknown as AuthResponse;
      console.log('AuthProvider: Login response:', response);

      if (response && response.success && response.user) {
        console.log('AuthProvider: Login successful');
        setUser(response.user);
        setUserType(type);

        if (response.user.token) {
          localStorage.setItem('authToken', response.user.token);
          console.log('AuthProvider: Token stored');
        }

        const targetPage = type === 'user' ? 'user-dashboard' : 'admin-dashboard';
        setCurrentPage(targetPage);
        localStorage.setItem('currentPage', targetPage);
        console.log('AuthProvider: Page set to:', targetPage);

        toast.success(`Welcome back, ${response.user.name}!`);
      } else {
        console.error('AuthProvider: Login failed - invalid response');
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('AuthProvider: Login error:', error);
      // Don't set loading here either - let the error propagate to login component
      throw error;
    }
    // No finally block with setLoading - login components manage their own loading state
  };

  const logout = async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setUserType(null);
      setCurrentPage('user-login');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentPage');
      toast.success('Logged out successfully');
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const response = await apiService.auth.getMe() as unknown as AuthResponse;
      if (response && response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const handleSetCurrentPage = (page: string) => {
    setCurrentPage(page);
    localStorage.setItem('currentPage', page);
    window.location.hash = page;
  };

  const authContextValue = {
    user,
    userType,
    loading,
    login,
    logout,
    currentPage,
    setCurrentPage: handleSetCurrentPage,
    selectedModuleId,
    setSelectedModuleId,
    refreshUser
  };

  console.log('AuthProvider: Current state:', { user, userType, loading, initialized });

  if (!initialized || loading) {
    console.log('AuthProvider: Still loading');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!user && initialized && !loading) {
    console.log('AuthProvider: User is null - showing login');
  }

  console.log('AuthProvider: Rendering context provider');
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};