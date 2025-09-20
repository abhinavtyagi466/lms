import React, { useState } from 'react';
import { LogOut, X, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface LogoutPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
  loading: boolean;
  userName?: string;
}

export const LogoutPopup: React.FC<LogoutPopupProps> = ({
  isOpen,
  onClose,
  onLogout,
  loading,
  userName
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleLogout = async () => {
    try {
      await onLogout();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
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
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6 text-white" />
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
            <CardTitle className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              Logout Confirmation
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {userName ? `Goodbye, ${userName}!` : 'Are you sure you want to logout?'}
            </p>
          </CardHeader>

          <CardContent>
            {showSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Logged Out Successfully!</h3>
                <p className="text-gray-600 dark:text-gray-400">Thank you for using our platform</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Warning Message */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">Before you go...</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Make sure you've saved any important work. You'll need to sign in again to access your account.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
  {/* Cancel Button */}
  <Button
    variant="outline"
    onClick={onClose}
    disabled={loading}
    className="flex-1 h-12 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white 
               hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 
               transition-all duration-200"
  >
    <X className="w-4 h-4 mr-2" />
    Cancel
  </Button>

  {/* Logout Button (Red) */}
  <Button
    onClick={handleLogout}
    disabled={loading}
    className="flex-1 h-12 bg-red-600 hover:bg-red-700 
               text-white font-semibold rounded-lg shadow-lg hover:shadow-xl 
               border border-red-700 
               transition-all duration-200 transform hover:scale-[1.02] 
               disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
  >
    {loading ? (
      <>
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Logging Out...
      </>
    ) : (
      <>
        <LogOut className="w-5 h-5 mr-2" />
        Logout
      </>
    )}
  </Button>
</div>


                {/* Additional Info */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your session will be securely terminated
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
