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

    // Create a Supabase client
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

    // SECURITY: Verify admin status server-side
    const { data: isAdminVerified, error: adminError } = await supabase.rpc('verify_admin_status')
    
    if (adminError || !isAdminVerified) {
      // Log unauthorized access attempt
      await supabase
        .from('admin_logs')
        .insert({
          admin_id: user.id,
          action: 'unauthorized_admin_token_attempt',
          details: {
            user_email: user.email,
            ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
            user_agent: req.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        })

      return new Response(
        JSON.stringify({ error: 'Insufficient privileges' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate a secure admin token
    const tokenData = {
      user_id: user.id,
      email: user.email,
      role: 'admin',
      issued_at: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
      scope: 'admin_operations'
    }

    // Create a JWT-like token (in production, use proper JWT signing)
    const tokenPayload = btoa(JSON.stringify(tokenData))
    const signature = await crypto.subtle.digest(
      'SHA-256', 
      new TextEncoder().encode(tokenPayload + Deno.env.get('SUPABASE_JWT_SECRET'))
    )
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const adminToken = `admin_${tokenPayload}.${signatureHex.substring(0, 32)}`

    // Log successful token creation
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: user.id,
        action: 'admin_token_created',
        details: {
          user_email: user.email,
          token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
          ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
          timestamp: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({
        token: adminToken,
        expires_at: tokenData.expires_at,
        scope: tokenData.scope
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in create-admin-token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})