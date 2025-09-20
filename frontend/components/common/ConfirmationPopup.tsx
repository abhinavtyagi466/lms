import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'danger':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-600">{message}</p>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

