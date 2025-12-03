import React, { useState } from 'react';
import { CheckCircle, X, Loader2, User, Lock, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string, userType: 'user' | 'admin') => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const LoginPopup: React.FC<LoginPopupProps> = ({
  isOpen,
  onClose,
  onLogin,
  loading,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'user' | 'admin'>('user');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onLogin(email, password, userType);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setEmail('');
        setPassword('');
      }, 1500);
    } catch (error) {
      // Error is handled by parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="animate-in zoom-in-95 duration-300">
        <Card className="w-full max-w-md bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-0 shadow-2xl rounded-3xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <User className="w-6 h-6 text-white" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Welcome Back!
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
          </CardHeader>

          <CardContent>
            {showSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Login Successful!</h3>
                <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Type Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Login As</Label>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant={userType === 'user' ? 'default' : 'outline'}
                      onClick={() => setUserType('user')}
                      className={`flex-1 transition-all duration-200 ${userType === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'hover:bg-blue-50 hover:border-blue-300'
                        }`}
                    >
                      <User className="w-4 h-4 mr-2 text-gray-700 dark:text-gray-300" />
                      User
                    </Button>
                    <Button
                      type="button"
                      variant={userType === 'admin' ? 'default' : 'outline'}
                      onClick={() => setUserType('admin')}
                      className={`flex-1 transition-all duration-200 ${userType === 'admin'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                          : 'hover:bg-purple-50 hover:border-purple-300'
                        }`}
                    >
                      <User className="w-4 h-4 mr-2 text-gray-700 dark:text-gray-300" />
                      Admin
                    </Button>
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                    {error.includes('Access Denied') && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        Please use the correct login page for your account type.
                      </p>
                    )}
                  </div>
                )}

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5 mr-2 text-white" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
