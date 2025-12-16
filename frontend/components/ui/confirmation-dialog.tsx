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
          icon: <AlertTriangle className="w-10 h-10 text-amber-500" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-10 h-10 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'info':
        return {
          icon: <Info className="w-10 h-10 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'danger':
        return {
          icon: <XCircle className="w-10 h-10 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <Shield className="w-10 h-10 text-amber-500" />,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const iconConfig = getIconConfig();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
        onClick={onClose}
      />

      {/* Dialog - TRULY CENTERED */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* Icon Section - Reduced padding to remove blank space */}
          <div className={`${iconConfig.bgColor} px-6 pt-4 pb-4 flex flex-col items-center border-b ${iconConfig.borderColor}`}>
            <div className={`p-3 rounded-full ${iconConfig.bgColor} border-2 ${iconConfig.borderColor} mb-2`}>
              {iconConfig.icon}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {title}
            </h2>
          </div>

          {/* Description */}
          <div className="px-6 py-6 bg-white dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Buttons - BOTH VISIBLE */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-[120px] border-2 border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className={`min-w-[140px] font-semibold ${getConfirmButtonStyle()}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
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
    </>
  );
};
