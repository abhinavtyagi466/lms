import React from 'react';
import { AlertTriangle, RefreshCw, Server } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
}

const NetworkError: React.FC<NetworkErrorProps> = ({ 
  onRetry, 
  message = "Backend server is not running. Please start the backend server." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Server className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-600 dark:text-red-400">Server Connection Error</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">To fix this issue:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Make sure MongoDB is running</li>
                  <li>Run the backend server: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">npm start</code> in the backend folder</li>
                  <li>Or double-click <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">start-backend.bat</code></li>
                </ol>
              </div>
            </div>
          </div>
          
          {onRetry && (
            <Button 
              onClick={onRetry} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkError;
