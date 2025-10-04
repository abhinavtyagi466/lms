import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = 'default', duration = 5000 }: ToastProps) => {
    const message = title || description || '';
    const desc = title && description ? description : undefined;

    switch (variant) {
      case 'destructive':
        sonnerToast.error(message, {
          description: desc,
          duration,
        });
        break;
      case 'success':
        sonnerToast.success(message, {
          description: desc,
          duration,
        });
        break;
      default:
        sonnerToast(message, {
          description: desc,
          duration,
        });
    }
  };

  return { toast };
}

