import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the OpenAI API key from environment or database
    let openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    // If not in environment, check if user has a custom API key
    if (!openaiApiKey) {
      const { data: provider } = await supabase
        .from('admin_ai_providers')
        .select('configuration')
        .eq('provider_type', 'openai')
        .eq('is_active', true)
        .maybeSingle()

      if (provider?.configuration?.api_key) {
        openaiApiKey = provider.configuration.api_key
      }
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured. Please add your API key in the admin settings.' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate an ephemeral client secret with OpenAI Realtime API
    const model = 'gpt-realtime';

    const ephemeralResp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model
        }
      })
    });

    if (!ephemeralResp.ok) {
      const errText = await ephemeralResp.text();
      return new Response(
        JSON.stringify({ error: `OpenAI ephemeral key error: ${errText}` }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const ephemeralData = await ephemeralResp.json();
    const responseBody = {
      session_id: crypto.randomUUID(),
      client_secret: ephemeralData?.client_secret?.value,
      model,
      expires_at: ephemeralData?.client_secret?.expires_at
    };

    // Log the session creation (optional)
    await supabase
      .from('voice_sessions')
      .insert({
        user_id: user.id,
        session_token: 'realtime_session',
        status: 'active',
        metadata: {
          model,
          created_at: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify(responseBody),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in get-realtime-token:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})