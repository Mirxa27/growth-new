import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get current session ID
    const currentSessionId = req.headers.get('x-session-id') || 'unknown'

    // Get user sessions from auth.sessions (this would need to be implemented in your DB schema)
    // For now, we'll return mock data based on the current session
    const sessions = [
      {
        id: currentSessionId,
        userId: user.id,
        device: 'Current Device',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        location: null,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isCurrent: true
      }
    ]

    // In a real implementation, you would query a user_sessions table
    // const { data: userSessions } = await supabase
    //   .from('user_sessions')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .order('last_activity', { ascending: false })

    return new Response(
      JSON.stringify({ sessions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error getting user sessions:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})