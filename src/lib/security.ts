import { supabase } from "@/integrations/supabase/client";

// Security audit logging utility
export const securityAudit = {
  async logAction(action: string, resource: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('security_audit_log').insert([{
        user_id: user?.id || null,
        action,
        resource,
        details: details || {},
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      }]);
    } catch (error) {
      console.error('Failed to log security action:', error);
    }
  },

  async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  },

  // Log admin actions
  async logAdminAction(action: string, targetUserId?: string, details?: any) {
    await this.logAction(`admin_${action}`, 'admin_panel', {
      target_user_id: targetUserId,
      ...details
    });
  },

  // Log authentication events
  async logAuthEvent(event: 'login' | 'logout' | 'failed_login' | 'password_change', details?: any) {
    await this.logAction(`auth_${event}`, 'authentication', details);
  },

  // Log data access
  async logDataAccess(resource: string, operation: 'read' | 'write' | 'delete', recordId?: string) {
    await this.logAction(`data_${operation}`, resource, { record_id: recordId });
  }
};

// Rate limiting utilities
export const rateLimiting = {
  // Client-side rate limiting cache
  rateLimitCache: new Map<string, { count: number; resetTime: number }>(),

  checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const existing = this.rateLimitCache.get(key);

    if (!existing || now > existing.resetTime) {
      this.rateLimitCache.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (existing.count >= maxRequests) {
      return false;
    }

    existing.count++;
    return true;
  },

  // Generate rate limit key
  generateKey(type: 'auth' | 'chat' | 'api', identifier: string): string {
    return `${type}:${identifier}`;
  },

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.rateLimitCache.entries()) {
      if (now > value.resetTime) {
        this.rateLimitCache.delete(key);
      }
    }
  }
};

// Content Security Policy helpers
export const csp = {
  // Validate that URLs are from allowed domains
  isAllowedDomain(url: string, allowedDomains: string[]): boolean {
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  },

  // Generate nonce for inline scripts
  generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }
};

// Session security monitoring
export const sessionSecurity = {
  // Check for suspicious session activity
  async checkSessionSecurity() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Log session verification
      await securityAudit.logAction('session_check', 'authentication', {
        session_id: session.access_token.substring(0, 10) + '...',
        expires_at: session.expires_at
      });

      // Check if session is about to expire
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      if (expiresAt && (expiresAt - now) < 300) { // 5 minutes
        console.warn('Session expiring soon');
        await securityAudit.logAction('session_expiring', 'authentication');
      }
    } catch (error) {
      console.error('Session security check failed:', error);
    }
  },

  // Monitor for multiple tabs/sessions
  async detectMultipleSessions() {
    const sessionKey = 'newomen_session_active';
    const currentTime = Date.now();
    
    const lastActivity = localStorage.getItem(sessionKey);
    if (lastActivity && (currentTime - parseInt(lastActivity)) < 1000) {
      // Potential multiple session detected
      await securityAudit.logAction('multiple_sessions_detected', 'authentication');
    }
    
    localStorage.setItem(sessionKey, currentTime.toString());
  }
};

// Initialize security monitoring
export const initializeSecurity = () => {
  // Clean up rate limit cache every 5 minutes
  setInterval(() => {
    rateLimiting.cleanup();
  }, 5 * 60 * 1000);

  // Check session security every 10 minutes
  setInterval(() => {
    sessionSecurity.checkSessionSecurity();
  }, 10 * 60 * 1000);

  // Detect multiple sessions every 30 seconds
  setInterval(() => {
    sessionSecurity.detectMultipleSessions();
  }, 30 * 1000);
};