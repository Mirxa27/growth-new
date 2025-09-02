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
        .single()

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

    // Create a temporary session token for the realtime API
    // In production, you might want to create a more secure token
    const sessionToken = {
      client_secret: openaiApiKey,
      user_id: user.id,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
    }

    // Log the session creation (optional)
    await supabase
      .from('voice_sessions')
      .insert({
        user_id: user.id,
        session_token: 'realtime_session',
        status: 'active',
        metadata: {
          model: 'gpt-4o-realtime-preview',
          created_at: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify(sessionToken),
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