import React from 'react';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export const NotFound: React.FC = () => {
    const { setCurrentPage, userType, user } = useAuth();

    const handleGoHome = () => {
        if (user) {
            // Navigate to appropriate dashboard based on user type
            if (userType === 'user') {
                setCurrentPage('user-dashboard');
            } else {
                setCurrentPage('admin-dashboard');
            }
        } else {
            // Navigate to login page if not authenticated
            setCurrentPage('user-login');
        }
    };

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
            <div className="max-w-2xl w-full text-center">
                {/* Animated 404 */}
                <div className="mb-8 relative">
                    <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 leading-none animate-pulse">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <AlertCircle className="w-24 h-24 md:w-32 md:h-32 text-blue-500 dark:text-blue-400 animate-bounce" />
                    </div>
                </div>

                {/* Error Message */}
                <div className="mb-8 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                        Oops! The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="mb-12 flex justify-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        onClick={handleGoHome}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                        style={{ backgroundImage: 'none' }}
                    >
                        <Home className="w-5 h-5" />
                        Go to Home
                    </Button>

                    <Button
                        onClick={handleGoBack}
                        variant="outline"
                        className="border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 bg-white dark:bg-gray-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </Button>
                </div>

                {/* Additional Help Text */}
                <div className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Need Help?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        If you believe this is an error, please contact your system administrator or try refreshing the page.
                    </p>
                </div>

                {/* Floating Animation Background */}
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob"></div>
                    <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-200 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>
            </div>

            <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
};

export default NotFound;
