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
    // Get page from URL hash or localStorage, default to user-login
    const hash = window.location.hash.replace('#', '');
    const savedPage = localStorage.getItem('currentPage');
    return hash || savedPage || 'user-login';
  });
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Handle URL hash changes and localStorage persistence with security checks
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage) {
        // Security check: Don't allow accessing protected pages without authentication
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

        // If trying to access protected page without user, redirect to login
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

        // If user type doesn't match page type, redirect
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

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Save current page to localStorage whenever it changes
    if (currentPage && currentPage !== 'user-login' && currentPage !== 'admin-login') {
      localStorage.setItem('currentPage', currentPage);
      // Update URL hash
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
              // Set default page based on user type
              const currentHash = window.location.hash.replace('#', '');
              const savedPage = localStorage.getItem('currentPage');

              // If no hash and no saved page, set default
              if (!currentHash && !savedPage) {
                const defaultPage = response.user.userType === 'user' ? 'user-dashboard' : 'admin-dashboard';
                setCurrentPage(defaultPage);
                console.log('AuthProvider: Set default page to:', defaultPage);
              } else if (savedPage && !currentHash) {
                // If there's a saved page but no hash, use saved page
                setCurrentPage(savedPage);
                console.log('AuthProvider: Using saved page:', savedPage);
              }
              console.log('AuthProvider: User authenticated successfully');
            } else {
              // Invalid response, clear token
              console.log('AuthProvider: Invalid response, clearing token');
              localStorage.removeItem('authToken');
              setUser(null);
              setUserType(null);
              console.log('AuthProvider: Token cleared due to invalid response');
            }
          } catch (authError) {
            console.error('AuthProvider: getMe failed:', authError);
            // Clear token on auth failure
            localStorage.removeItem('authToken');
            setUser(null);
            setUserType(null);
            console.log('AuthProvider: Token cleared due to auth error');
          }
        } else {
          console.log('AuthProvider: No token found, user not authenticated');
          // Clear any stored page data when not authenticated
          localStorage.removeItem('currentPage');
        }
      } catch (error) {
        console.error('AuthProvider: Token validation failed:', error);

        // Check if it's a network error (backend not running)
        if (error instanceof Error && error.message.includes('Backend server is not running')) {
          console.log('AuthProvider: Backend server is not running, keeping token for when server comes back online');
          // Don't clear token for network errors, just log the issue
          return;
        }

        // For other errors (invalid token, etc.), clear the token
        localStorage.removeItem('authToken');
        setUser(null);
        setUserType(null);
        console.log('AuthProvider: Cleared invalid token');
      } finally {
        console.log('AuthProvider: Setting loading to false and initialized to true');
        setLoading(false);
        setInitialized(true);
      }
    };

    // Listen for auth-failed events from API interceptor
    const handleAuthFailed = () => {
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

  const login = async (email: string, password: string, type: 'user' | 'admin') => {
    setLoading(true);
    try {
      console.log('AuthProvider: Starting login for:', email, type);
      const response = await apiService.auth.login(email, password, type) as unknown as AuthResponse;
      console.log('AuthProvider: Login response:', response);

      if (response && response.success && response.user) {
        console.log('AuthProvider: Login successful, setting user state');
        setUser(response.user);
        setUserType(type);

        // Store auth token first
        if (response.user.token) {
          localStorage.setItem('authToken', response.user.token);
          console.log('AuthProvider: Token stored in localStorage');
        }

        // Set current page based on user type
        const targetPage = type === 'user' ? 'user-dashboard' : 'admin-dashboard';
        setCurrentPage(targetPage);
        localStorage.setItem('currentPage', targetPage);
        console.log('AuthProvider: Current page set to:', targetPage);

        toast.success(`Welcome back, ${response.user.name}!`);
        console.log('AuthProvider: Login completed successfully');
      } else {
        console.error('AuthProvider: Login failed - invalid response:', response);
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('AuthProvider: Login error:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      // toast.error(errorMessage); // Let login components handle specific error messages
      throw error;
    } finally {
      setLoading(false);
    }
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

  // Enhanced setCurrentPage function that updates URL and localStorage
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

  // Don't render children until context is initialized
  if (!initialized || loading) {
    console.log('AuthProvider: Not initialized yet or still loading, showing loading');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  // Debug: Log when user is null but should be authenticated
  if (!user && initialized && !loading) {
    console.log('AuthProvider: User is null but context is initialized - showing login');
  }

  console.log('AuthProvider: Initialized, rendering context provider');
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};