import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Try to load active OpenAI provider config; fallback to env var
    let apiKeyFromDb: string | null = null
    try {
      const { data: provider } = await supabaseClient
        .from('admin_ai_providers')
        .select('*')
        .eq('provider_type', 'openai')
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)
        .single()
      if (provider?.configuration?.api_key) {
        apiKeyFromDb = String(provider.configuration.api_key)
      }
    } catch (_) {}

    const openaiKey = apiKeyFromDb || Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Fetch active voice agent config for model/voice
    let model = 'gpt-4o-realtime-preview-2024-10-01'
    try {
      const { data: cfg } = await supabaseClient
        .from('voice_agent_configs')
        .select('model')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      if (cfg?.model) model = cfg.model
    } catch (_) {}

    // Create an ephemeral client secret via OpenAI for the browser to use with Realtime
    const ephemResp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model,
        }
      })
    })

    if (!ephemResp.ok) {
      const txt = await ephemResp.text()
      throw new Error(`Failed to create ephemeral token: ${ephemResp.status} ${txt}`)
    }

    const ephem = await ephemResp.json()
    const clientSecret = ephem?.client_secret?.value || ephem?.client_secret
    const expiresAt = ephem?.client_secret?.expires_at || (Date.now() + (60 * 60 * 1000))

    return new Response(
      JSON.stringify({
        client_secret: clientSecret,
        model,
        expires_at: expiresAt,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error generating voice token:', error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})