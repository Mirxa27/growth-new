import { useEffect } from 'react';
import { securityAudit } from '@/lib/security';
import { useAuth } from './useAuth';

export const useSecurityAudit = () => {
  const { user } = useAuth();

  // Auto-log important user actions
  useEffect(() => {
    if (user) {
      securityAudit.logAuthEvent('login');
    }

    // Log page visibility changes (potential security concern)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        securityAudit.logAction('page_hidden', 'user_activity');
      } else {
        securityAudit.logAction('page_visible', 'user_activity');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const logAdminAction = async (action: string, targetUserId?: string, details?: any) => {
    await securityAudit.logAdminAction(action, targetUserId, details);
  };

  const logDataAccess = async (resource: string, operation: 'read' | 'write' | 'delete', recordId?: string) => {
    await securityAudit.logDataAccess(resource, operation, recordId);
  };

  const logSecurityEvent = async (event: string, details?: any) => {
    await securityAudit.logAction(`security_${event}`, 'security', details);
  };

  return {
    logAdminAction,
    logDataAccess,
    logSecurityEvent
  };
};