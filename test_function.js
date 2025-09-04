import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ufgqmqoykddaotdbwteg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getFunctionUrl() {
  const { data, error } = await supabase.functions.invoke('test-ai-provider', {
    body: { name: 'Functions' },
  });
  console.log(data);
  console.error(error);
}

getFunctionUrl();