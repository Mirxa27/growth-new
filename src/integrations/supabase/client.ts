import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/environment';
import type { Database } from './types';

// Sanitize headers to prevent non-ASCII character issues
const sanitizeHeader = (value: string): string => {
  // Remove quotes and non-ASCII characters
  return value.replace(/['"]/g, '').replace(/[^\x00-\x7F]/g, '');
};

// Create Supabase client with proper typing and configuration
export const supabase = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-application-name': sanitizeHeader(env.app.name || 'Life-Navigation-System'),
        'x-application-version': sanitizeHeader(env.app.version || '1.0.0'),
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Helper function to get service role client (for admin operations)
export const getServiceRoleClient = () => {
  if (!env.supabase.serviceRoleKey) {
    throw new Error('Service role key not configured');
  }
  
  return createClient<Database>(
    env.supabase.url,
    env.supabase.serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-application-name': sanitizeHeader(`${env.app.name || 'Life-Navigation-System'}-admin`),
          'x-application-version': sanitizeHeader(env.app.version || '1.0.0'),
        },
      },
    }
  );
};