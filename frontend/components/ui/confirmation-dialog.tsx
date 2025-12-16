import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, Shield, X } from 'lucide-react';
import { Button } from './button';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  type?: 'warning' | 'success' | 'info' | 'danger';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-amber-500 mb-2" />,
          buttonColor: 'bg-amber-500 hover:bg-amber-600'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500 mb-2" />,
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'info':
        return {
          icon: <Info className="w-12 h-12 text-blue-500 mb-2" />,
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'danger':
        return {
          icon: <XCircle className="w-12 h-12 text-red-500 mb-2" />,
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      default:
        return {
          icon: <Shield className="w-12 h-12 text-blue-500 mb-2" />,
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const config = getIconConfig();

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Icon - directly in the white container */}
            {config.icon}

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {description}
            </p>

            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg"
              >
                {cancelText}
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 h-11 text-white font-medium rounded-lg shadow-sm ${config.buttonColor}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
