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
  userType: 'user' | 'admin';
  employeeId?: string;
  department?: string;
  status?: string;
  kpiScore?: number;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  userType: 'user' | 'admin' | null;
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
  const [userType, setUserType] = useState<'user' | 'admin' | null>(null);
  const [currentPage, setCurrentPage] = useState('user-login');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Check for existing auth token on app load
  useEffect(() => {
    console.log('AuthProvider: useEffect triggered');
    const checkAuthStatus = async () => {
      console.log('AuthProvider: checkAuthStatus started');
      try {
        const token = localStorage.getItem('authToken');
        console.log('AuthProvider: Token found:', !!token);
        if (token) {
          const response = await apiService.auth.getMe() as unknown as AuthResponse;
          console.log('AuthProvider: getMe response:', response);
          if (response && response.success && response.user) {
            setUser(response.user);
            setUserType(response.user.userType);
            setCurrentPage(response.user.userType === 'user' ? 'user-dashboard' : 'admin-dashboard');
            console.log('AuthProvider: User authenticated successfully');
          } else {
            // Invalid response, clear token
            localStorage.removeItem('authToken');
            console.log('AuthProvider: Invalid response, cleared token');
          }
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
        console.log('AuthProvider: Cleared invalid token');
      } finally {
        console.log('AuthProvider: Setting loading to false and initialized to true');
        setLoading(false);
        setInitialized(true);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string, type: 'user' | 'admin') => {
    setLoading(true);
    try {
      const response = await apiService.auth.login(email, password, type) as unknown as AuthResponse;
      
      if (response && response.success && response.user) {
        setUser(response.user);
        setUserType(type);
        setCurrentPage(type === 'user' ? 'user-dashboard' : 'admin-dashboard');
        
        // Store auth token
        if (response.user.token) {
          localStorage.setItem('authToken', response.user.token);
        }
        
        toast.success(`Welcome back, ${response.user.name}!`);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
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

  const authContextValue = {
    user,
    userType,
    loading,
    login,
    logout,
    currentPage,
    setCurrentPage,
    selectedModuleId,
    setSelectedModuleId,
    refreshUser
  };

  console.log('AuthProvider: Current state:', { user, userType, loading, initialized });

  // Don't render children until context is initialized
  if (!initialized) {
    console.log('AuthProvider: Not initialized yet, showing loading');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  console.log('AuthProvider: Initialized, rendering context provider');
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};