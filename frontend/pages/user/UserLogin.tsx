import React, { useState } from 'react';
import { GraduationCap, Sun, Moon, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/error-message';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';

export const UserLogin: React.FC = () => {
  const { login } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(null);
    setError(null);
    
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(null);
    setError(null);
    
    if (value && value.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setEmailError(null);
    setPasswordError(null);
    
    // Validation
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password, 'user');
      toast.success('Welcome back! Login successful.');
    } catch (error: any) {
      console.error('User login error:', error);
      
      // Handle specific access denied errors
      if (error?.response?.data?.error === 'Access Denied') {
        const userType = error?.response?.data?.userType;
        const attemptedAccess = error?.response?.data?.attemptedAccess;
        const errorMessage = error?.response?.data?.message || `Access denied. ${userType} accounts cannot access the user dashboard.`;
        
        setError(errorMessage);
        toast.error(`Access Denied: ${userType} accounts cannot access user dashboard`);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || 'Login failed. Please check your credentials and try again.';
        setError(errorMessage);
        toast.error('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-blue-900 via-gray-900 to-indigo-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-indigo-100'
    } flex items-center justify-center p-4`}>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Welcome Section */}
        <div className="text-center lg:text-left space-y-6">
          <div className="space-y-4">
            <div className={`w-20 h-20 mx-auto lg:mx-0 rounded-2xl flex items-center justify-center ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            } shadow-lg`}>
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className={`text-4xl lg:text-5xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome Sir
            </h1>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            } max-w-md mx-auto lg:mx-0`}>
              Access your personalized learning dashboard and continue your professional development journey with our comprehensive e-learning platform.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <div className={`px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-blue-100'
            }`}>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-blue-700'
              }`}>
                📚 Learning Modules
              </span>
            </div>
            <div className={`px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-blue-100'
            }`}>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-blue-700'
              }`}>
                🏆 Progress Tracking
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
                User Sign In
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Enter your credentials to access your learning dashboard
              </p>
              <div className={`mt-3 p-3 rounded-lg ${
                isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-xs ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  <strong>Who can access:</strong> Field Executives (Users) only
                </p>
              </div>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <ErrorMessage
                  type="error"
                  message={error}
                  onDismiss={() => setError(null)}
                />
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="your.email@company.com"
                    className={`pl-10 h-12 ${
                      emailError 
                        ? 'border-red-500 focus:border-red-500' 
                        : isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {emailError}
                  </p>
                )}
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    className={`pl-10 pr-10 h-12 ${
                      passwordError 
                        ? 'border-red-500 focus:border-red-500' 
                        : isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <button 
                  type="button" 
                  className={`text-sm font-medium transition-colors ${
                    isDarkMode 
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  Forgot Password?
                </button>
              </div>
              
              <Button 
                type="submit" 
                size="lg"
                className={`w-full h-12 font-medium rounded-xl transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-200 text-black hover:bg-blue-300'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Don't have an account?{' '}
                <button className={`font-medium transition-colors ${
                  isDarkMode 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700'
                }`}>
                  Register here
                </button>
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="p-2"
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
