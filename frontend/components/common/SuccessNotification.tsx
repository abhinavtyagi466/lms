import React, { useEffect, useState } from 'react';
import { CheckCircle, X, Download, Award, User, BookOpen, FileQuestion } from 'lucide-react';
import { Button } from '../ui/button';

interface SuccessNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'user' | 'module' | 'quiz' | 'question' | 'kpi' | 'award' | 'certificate';
  action: 'created' | 'updated' | 'deleted' | 'completed';
  itemName?: string;
  autoClose?: boolean;
  duration?: number;
}

export const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  isVisible,
  onClose,
  type,
  action,
  itemName,
  autoClose = true,
  duration = 3000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoClose, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'user':
        return <User className="w-5 h-5" />;
      case 'module':
        return <BookOpen className="w-5 h-5" />;
      case 'quiz':
        return <FileQuestion className="w-5 h-5" />;
      case 'question':
        return <FileQuestion className="w-5 h-5" />;
      case 'kpi':
        return <Award className="w-5 h-5" />;
      case 'award':
        return <Award className="w-5 h-5" />;
      case 'certificate':
        return <Download className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getMessage = () => {
    const item = itemName || type;
    switch (action) {
      case 'created':
        return `${item} created successfully!`;
      case 'updated':
        return `${item} updated successfully!`;
      case 'deleted':
        return `${item} deleted successfully!`;
      case 'completed':
        return `${item} completed successfully!`;
      default:
        return `Action completed successfully!`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-2xl shadow-xl p-6 min-w-80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              {getIcon()}
            </div>
          </div>
          
          <div className="flex-1">
            <p className="font-medium text-green-800">{getMessage()}</p>
            <p className="text-sm text-green-600">
              {action === 'created' && 'New item has been added to the system.'}
              {action === 'updated' && 'Changes have been saved successfully.'}
              {action === 'deleted' && 'Item has been removed from the system.'}
              {action === 'completed' && 'Great job! Keep up the good work.'}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex-shrink-0 text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

