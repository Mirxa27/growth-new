import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

app.post('/get-realtime-token', async (req, res) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin_backup')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin_backup) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  try {
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error: 'Failed to get token from OpenAI', details: error });
    }

    const tokenData = await response.json();
    res.json(tokenData);
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred', details: error });
  }
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});