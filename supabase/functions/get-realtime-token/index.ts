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

    // Return a client secret style token; for now we return the API key
    const ephemeralToken = openaiKey

    return new Response(
      JSON.stringify({
        client_secret: ephemeralToken,
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hour from now
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