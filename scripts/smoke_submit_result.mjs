import { createClient } from '@supabase/supabase-js';

// Use same defaults as src/integrations/supabase/client.ts
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ufgqmqoykddaotdbwteg.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ3FtcW95a2RkYW90ZGJ3dGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjM2ODEsImV4cCI6MjA2NzYzOTY4MX0.GLz_6uDKKWkpO0SNwevp7oZc3CNOkv4Rr5p-ObWyX8M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const payload = {
    assessment_id: 'personality-basics',
    client_questions: [
      { id: 'p1', text: 'In social situations, you tend to:', type: 'single', options: [] },
      { id: 'p2', text: 'When making decisions, you primarily rely on:', type: 'single', options: [] },
      { id: 'p3', text: 'Your ideal weekend involves:', type: 'single', options: [] },
      { id: 'p4', text: 'When faced with unexpected changes, you:', type: 'single', options: [] },
      { id: 'p5', text: 'Rate your comfort with uncertainty:', type: 'scale', scale: { min: 1, max: 5 } },
    ],
    answers: [
      { question_id: 'p1', value: 'Initiate conversations with new people' },
      { question_id: 'p2', value: 'Logic and objective analysis' },
      { question_id: 'p3', value: 'Adventure and new experiences' },
      { question_id: 'p4', value: 'Embrace the change enthusiastically' },
      { question_id: 'p5', value: 4 },
    ],
    time_taken_seconds: 42,
    meta: { source: 'smoke-script' },
  };

  const { data, error } = await supabase.functions.invoke('submit-result', { body: payload });
  if (error) {
    console.error('Invoke error:', error);
    process.exit(1);
  }
  console.log('Response:', JSON.stringify(data, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

