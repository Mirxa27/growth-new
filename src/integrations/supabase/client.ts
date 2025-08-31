import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback to hardcoded values
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
                     import.meta.env.VITE_SUPABASE_URL || 
                     "https://ufgqmqoykddaotdbwteg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                                 import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
                                 "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase: any = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY as any, {
  auth: {
    storage: (typeof localStorage !== 'undefined' ? localStorage : undefined),
    persistSession: true,
    autoRefreshToken: true,
  }
}) as any;