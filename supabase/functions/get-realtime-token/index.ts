import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // Create a Supabase client with the user's token
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

    // SECURITY: Verify admin status server-side before minting realtime token
    // This is a critical security check for voice agent access
    const { data: isAdminVerified, error: adminError } = await supabase.rpc('verify_admin_status')
    
    if (adminError) {
      console.error('Admin verification failed:', adminError)
      return new Response(
        JSON.stringify({ error: 'Admin verification failed' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!isAdminVerified) {
      // Log unauthorized access attempt
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: user.id,
          action: 'unauthorized_realtime_token_attempt',
          details: {
            user_email: user.email,
            ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
            user_agent: req.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        })

      return new Response(
        JSON.stringify({ error: 'Insufficient privileges. Admin access required for realtime voice features.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the OpenAI API key from environment variables or the database
    let openaiApiKey = Deno.env.get('OPENAI_API_KEY')

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

    // Fetch active voice agent configuration for model/voice
    let model = 'gpt-4o-realtime-preview-2024-10-01' // Default model
    try {
      const { data: cfg } = await supabase
        .from('voice_agent_configs')
        .select('model')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
      if (cfg?.model) {
        model = cfg.model
      }
    } catch (err) {
      console.warn("Could not fetch voice agent config, using default model.", err.message)
    }

    // Create an ephemeral client secret via OpenAI for the browser to use with Realtime API
    const ephemResp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
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
    const expiresAt = ephem?.client_secret?.expires_at || (Date.now() + (60 * 60 * 1000)) // Default to 1 hour expiry

    // Log the session creation (optional)
    const { error: logError } = await supabase
      .from('voice_sessions')
      .insert({
        user_id: user.id,
        session_token: `rt_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        status: 'active',
        metadata: {
          model: model,
          created_at: new Date().toISOString(),
          expires_at: new Date(expiresAt).toISOString()
        }
      })
    
    if (logError) {
        console.error("Failed to log voice session:", logError.message)
        // Decide if this should be a critical error. For now, we'll just log it.
    }

    // Return the client secret and model details to the client
    return new Response(
      JSON.stringify({
        client_secret: clientSecret,
        model,
        expires_at: expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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