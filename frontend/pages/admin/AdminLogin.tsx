import React, { useState } from 'react';
import { Shield, Sun, Moon, Mail, Lock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';

export const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password, 'admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // Handle specific access denied errors
      if (error?.response?.data?.error === 'Access Denied') {
        const userType = error?.response?.data?.userType;
        const attemptedAccess = error?.response?.data?.attemptedAccess;
        const errorMessage = error?.response?.data?.message || `Access denied. ${userType} accounts cannot access the admin dashboard.`;
        
        toast.error(`Access Denied: ${userType} accounts cannot access admin dashboard`);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Login failed. Please try again.';
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    } flex items-center justify-center p-4`}>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Welcome Section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="space-y-4">
            <div className={`w-20 h-20 mx-auto lg:mx-0 rounded-2xl flex items-center justify-center ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            } shadow-lg`}>
              <Shield className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h1 className={`text-4xl lg:text-5xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome Admin
            </h1>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            } max-w-md mx-auto lg:mx-0`}>
              Access your administrative dashboard and manage the e-learning platform with full control and oversight.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <div className={`px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                🔐 Secure Access
              </span>
            </div>
            <div className={`px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                📊 Full Control
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className={`p-8 shadow-2xl border-0 ${
          isDarkMode 
            ? 'bg-gray-800/50 backdrop-blur-sm border-gray-700' 
            : 'bg-white/80 backdrop-blur-sm border-gray-200'
        }`}>
          <div className="space-y-6">
            <div className="text-center">
              <h2 className={`text-2xl font-semibold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Admin Sign In
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Enter your credentials to access the admin panel
              </p>
              <div className={`mt-3 p-3 rounded-lg ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-xs ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  <strong>Who can access:</strong> Managers, HODs, HRs, and Admins only
                </p>
              </div>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Admin Email
                </Label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className={`pl-10 h-12 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Password
                </Label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`pl-10 h-12 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className={`w-full h-12 text-white font-medium transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                    : 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400'
                } focus:ring-2 focus:ring-offset-2`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Sign In as Admin'
                )}
              </Button>
            </form>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Authorized personnel only
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};