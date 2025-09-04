import { toast } from 'sonner';

// Centralized error handler
export const handleError = (error: any, context?: string) => {
  console.error(context || 'An error occurred', error);

  // In production, you would send this to a monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
  }

  // Show a user-friendly toast notification
  toast.error('An unexpected error occurred. Please try again later.');
};

// Specific API error handler
export const handleApiError = (error: any, context?: string) => {
  console.error(context || 'An API error occurred', error);

  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
  }

  // Customize toast for API errors
  toast.error('Failed to communicate with the server. Please check your connection.');
};