import React, { useState, useEffect, useCallback } from 'react';
import { AdminAuthService, AdminAuthStatus } from '@/services/admin-auth.service';
import { supabase } from '@/integrations/supabase/client';

/**
 * React hook for admin authentication
 */
export const useAdminAuth = (): AdminAuthStatus => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [verified, setVerified] = useState<boolean>(false);

  const checkAdminStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Client-side check
      const clientAdmin = await AdminAuthService.getCurrentUserAdminStatus();
      setIsAdmin(clientAdmin);

      // Server-side verification for critical operations
      if (clientAdmin) {
        const serverAdmin = await AdminAuthService.verifyAdminServerSide();
        setVerified(serverAdmin);
      } else {
        setVerified(false);
      }
    } catch (error) {
      console.warn('Admin status check failed:', error);
      setIsAdmin(false);
      setVerified(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, [checkAdminStatus]);

  return {
    isAdmin,
    loading,
    verified, // True only if server-side verification passed
    refresh: checkAdminStatus
  };
};

export default useAdminAuth;