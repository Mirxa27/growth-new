import { useState } from 'react';
import { rateLimiting } from '@/lib/security';

interface UseRateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  identifier?: string;
}

export const useRateLimit = (endpoint: string, options: UseRateLimitOptions = {}) => {
  const [isLimited, setIsLimited] = useState(false);
  const [resetTime, setResetTime] = useState<number | null>(null);

  const checkLimit = async (customIdentifier?: string): Promise<boolean> => {
    const identifier = customIdentifier || options.identifier || 'anonymous';
    const key = rateLimiting.generateKey(endpoint as any, identifier);
    
    // Try server-side rate limiting first
    try {
      const response = await fetch('/rate-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-endpoint': endpoint,
          'x-identifier': identifier,
        },
      });

      if (response.status === 429) {
        const data = await response.json();
        setIsLimited(true);
        setResetTime(Date.now() + (data.retryAfter * 1000));
        
        // Auto-reset after the limit expires
        setTimeout(() => {
          setIsLimited(false);
          setResetTime(null);
        }, data.retryAfter * 1000);
        
        return false;
      }

      setIsLimited(false);
      setResetTime(null);
      return true;
    } catch (error) {
      console.warn('Server rate limiting unavailable, falling back to client-side');
      
      // Fallback to client-side rate limiting
      const allowed = rateLimiting.checkRateLimit(
        key,
        options.maxRequests || 10,
        options.windowMs || 60000
      );

      if (!allowed) {
        setIsLimited(true);
        const resetIn = options.windowMs || 60000;
        setResetTime(Date.now() + resetIn);
        
        setTimeout(() => {
          setIsLimited(false);
          setResetTime(null);
        }, resetIn);
      }

      return allowed;
    }
  };

  const getRemainingTime = (): number => {
    if (!resetTime) return 0;
    return Math.max(0, resetTime - Date.now());
  };

  return {
    isLimited,
    checkLimit,
    getRemainingTime,
    resetTime
  };
};