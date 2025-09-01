import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Parse request body
    const { userId, configId, sessionId } = await req.json()

    if (userId !== user.id) {
      throw new Error('Unauthorized')
    }

    // Get OpenAI API key from environment
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // In production, you would generate a temporary token here
    // For now, we'll return a success response
    // This prevents exposing the API key to the client
    
    // Log the session creation
    await supabaseClient
      .from('voice_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        config_id: configId,
        started_at: new Date().toISOString(),
      })

    // Return token info (in production, this would be an ephemeral token)
    return new Response(
      JSON.stringify({
        success: true,
        token: 'ephemeral-token-placeholder', // Don't expose real API key
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        sessionId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})