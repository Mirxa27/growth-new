import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFunction() {
  // Note: This is a placeholder for a valid admin JWT.
  // In a real application, you would obtain this after an admin user logs in.
  const adminAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2MzY4MSwiZXhwIjoyMDY3NjM5NjgxfQ.ly1DdFt60DSLEUMtK5l0jr1G3TLiJnPohADSc4HZuwo';

  const { data, error } = await supabase.functions.invoke('test-ai-provider', {
    headers: {
      Authorization: `Bearer ${adminAuthToken}`,
    },
    body: {
      provider: 'openai',
    },
  });

  if (error) {
    console.error('Function invocation failed:', error);
  } else {
    console.log('Function invocation successful:', data);
  }
}

verifyFunction();