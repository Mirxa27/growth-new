import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Verify authentication
    const auth = req.headers.get('Authorization');
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = auth.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create realtime session token
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: 'alloy',
        modalities: ['text', 'audio'],
        instructions: `You are NewMe, an AI companion and personal growth coach specifically designed for women. 

Your role:
- Provide empathetic, supportive guidance for personal development
- Help women discover their authentic selves and build confidence
- Offer practical advice for career, relationships, and life challenges
- Create a safe, non-judgmental space for exploration and growth
- Encourage self-reflection and actionable insights

Communication style:
- Warm, understanding, and encouraging
- Ask thoughtful follow-up questions
- Validate feelings while offering constructive perspectives
- Use inclusive, empowering language
- Be concise but meaningful in your responses

Focus areas:
- Self-discovery and personal identity
- Career development and leadership
- Relationship dynamics and communication
- Mental health and wellness
- Goal setting and achievement
- Confidence building and self-worth

Remember: You're speaking with someone who has chosen to invest in their personal growth. Honor that courage and commitment.`,
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create realtime session',
          details: errorText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionData = await response.json();

    // Log session creation for monitoring
    await supabase
      .from('voice_sessions' as any)
      .insert({
        user_id: user.id,
        session_id: sessionData.id,
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: 'alloy',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select();

    return new Response(
      JSON.stringify({
        session_id: sessionData.id,
        client_secret: sessionData.client_secret,
        model: sessionData.model,
        expires_at: sessionData.expires_at
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Realtime token creation error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create realtime token',
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});