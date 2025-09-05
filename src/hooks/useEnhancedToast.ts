import { useToast as useBaseToast } from '@/hooks/use-toast';

export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

interface EnhancedToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactElement;
}

export const useEnhancedToast = () => {
  const { toast: baseToast, ...rest } = useBaseToast();

  const toast = ({
    title,
    description,
    variant = 'default',
    duration = 4000,
    action,
  }: EnhancedToastOptions) => {
    return baseToast({
      title,
      description,
      variant,
      duration,
      action,
      className: getToastClassName(variant),
    });
  };

  const success = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'success',
    });
  };

  const error = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'destructive',
    });
  };

  const warning = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'warning',
    });
  };

  const info = (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: 'info',
    });
  };

  return {
    toast,
    success,
    error,
    warning,
    info,
    ...rest,
  };
};

const getToastClassName = (variant: ToastVariant): string => {
  switch (variant) {
    case 'success':
      return 'glass-toast-success';
    case 'destructive':
      return 'glass-toast-error';
    case 'warning':
      return 'glass-toast-warning';
    case 'info':
      return 'glass-toast-info';
    default:
      return 'glass-toast';
  }
};
