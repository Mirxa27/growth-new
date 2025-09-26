import { supabase } from '@/integrations/supabase/client';
import { errorHandler, ErrorCategory, ErrorSeverity } from '@/services/error/error-handler.service';
import { cache } from '@/services/cache/cache.service';

export interface TOTPSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email' | null;
  backupCodesRemaining: number;
  lastUsed: string | null;
}

export interface SessionInfo {
  id: string;
  userId: string;
  device: string;
  ipAddress: string;
  location: string | null;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

class TwoFactorAuthService {
  private readonly CACHE_KEY_2FA_STATUS = 'auth:2fa_status';
  private readonly CACHE_KEY_SESSIONS = 'auth:sessions';

  /**
   * Generate TOTP setup for user
   */
  async generateTOTPSetup(): Promise<{ setup: TOTPSetup | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-totp', {
        method: 'POST'
      });

      if (error) throw error;

      return { setup: data?.setup as TOTPSetup, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'generate_totp_setup' }
      });
      return { setup: null, error: error as Error };
    }
  }

  /**
   * Verify and enable TOTP for user
   */
  async enableTOTP(token: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-totp', {
        method: 'POST',
        body: { token }
      });

      if (error) throw error;

      // Clear cache to refresh 2FA status
      cache.remove(this.CACHE_KEY_2FA_STATUS);

      return { success: data?.success || false, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'enable_totp', tokenLength: token.length }
      });
      return { success: false, error: error as Error };
    }
  }

  /**
   * Verify TOTP token for login
   */
  async verifyTOTP(token: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa-token', {
        method: 'POST',
        body: { token, method: 'totp' }
      });

      if (error) throw error;

      return { success: data?.success || false, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'verify_totp_login' }
      });
      return { success: false, error: error as Error };
    }
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(password: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('disable-2fa', {
        method: 'POST',
        body: { password }
      });

      if (error) throw error;

      // Clear cache
      cache.remove(this.CACHE_KEY_2FA_STATUS);

      return { success: data?.success || false, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'disable_2fa' }
      });
      return { success: false, error: error as Error };
    }
  }

  /**
   * Get 2FA status for current user
   */
  async getTwoFactorStatus(): Promise<{ status: TwoFactorStatus | null; error: Error | null }> {
    const cached = cache.get<TwoFactorStatus>(this.CACHE_KEY_2FA_STATUS);
    if (cached) {
      return { status: cached, error: null };
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-2fa-status', {
        method: 'GET'
      });

      if (error) throw error;

      const status = data?.status as TwoFactorStatus;
      if (status) {
        cache.set(this.CACHE_KEY_2FA_STATUS, status, { ttl: 300000 }); // 5 minutes
      }

      return { status, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'get_2fa_status' }
      });
      return { status: null, error: error as Error };
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(password: string): Promise<{ backupCodes: string[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-backup-codes', {
        method: 'POST',
        body: { password }
      });

      if (error) throw error;

      return { backupCodes: data?.backupCodes as string[] || null, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'regenerate_backup_codes' }
      });
      return { backupCodes: null, error: error as Error };
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(code: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-backup-code', {
        method: 'POST',
        body: { code }
      });

      if (error) throw error;

      return { success: data?.success || false, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'verify_backup_code' }
      });
      return { success: false, error: error as Error };
    }
  }

  /**
   * Setup SMS 2FA
   */
  async setupSMS2FA(phoneNumber: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('setup-sms-2fa', {
        method: 'POST',
        body: { phoneNumber }
      });

      if (error) throw error;

      // Clear cache
      cache.remove(this.CACHE_KEY_2FA_STATUS);

      return { success: data?.success || false, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'setup_sms_2fa' }
      });
      return { success: false, error: error as Error };
    }
  }

  /**
   * Verify SMS 2FA code
   */
  async verifySMSCode(code: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-sms-code', {
        method: 'POST',
        body: { code }
      });

      if (error) throw error;

      return { success: data?.success || false, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'verify_sms_code' }
      });
      return { success: false, error: error as Error };
    }
  }

  /**
   * Get user sessions
   */
  async getUserSessions(): Promise<{ sessions: SessionInfo[] | null; error: Error | null }> {
    const cached = cache.get<SessionInfo[]>(this.CACHE_KEY_SESSIONS);
    if (cached) {
      return { sessions: cached, error: null };
    }

    try {
      const { data, error } = await supabase.functions.invoke('get-user-sessions', {
        method: 'GET'
      });

      if (error) throw error;

      const sessions = data?.sessions as SessionInfo[];
      if (sessions) {
        cache.set(this.CACHE_KEY_SESSIONS, sessions, { ttl: 60000 }); // 1 minute
      }

      return { sessions, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'get_user_sessions' }
      });
      return { sessions: null, error: error as Error };
    }
  }

  /**
   * Revoke user session
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('revoke-session', {
        method: 'POST',
        body: { sessionId }
      });

      if (error) throw error;

      // Clear sessions cache
      cache.remove(this.CACHE_KEY_SESSIONS);

      return { success: data?.success || false, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'revoke_session', sessionId }
      });
      return { success: false, error: error as Error };
    }
  }

  /**
   * Revoke all other sessions
   */
  async revokeAllOtherSessions(): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('revoke-all-other-sessions', {
        method: 'POST'
      });

      if (error) throw error;

      // Clear sessions cache
      cache.remove(this.CACHE_KEY_SESSIONS);

      return { success: data?.success || false, error: null };
    } catch (error) {
      errorHandler.handleError(error, {
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.AUTHENTICATION,
        context: { action: 'revoke_all_other_sessions' }
      });
      return { success: false, error: error as Error };
    }
  }

  /**
   * Check if 2FA is required for current user
   */
  async is2FARequired(): Promise<boolean> {
    const { status } = await this.getTwoFactorStatus();
    return status?.enabled || false;
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    cache.remove(this.CACHE_KEY_2FA_STATUS);
    cache.remove(this.CACHE_KEY_SESSIONS);
  }
}

export const twoFactorAuthService = new TwoFactorAuthService();