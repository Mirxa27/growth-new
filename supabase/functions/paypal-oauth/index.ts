import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { grant_type, client_id, client_secret, mode } = await req.json()

    if (grant_type !== 'client_credentials') {
      throw new Error('Invalid grant type')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials not configured')
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    let resolvedClientId = Deno.env.get('PAYPAL_CLIENT_ID')
    let resolvedClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')
    let resolvedMode = Deno.env.get('PAYPAL_MODE') || 'sandbox'

    if (!resolvedClientId || !resolvedMode) {
      const { data: configRow } = await serviceClient
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'paypal_config')
        .maybeSingle()

      if (configRow?.setting_value) {
        try {
          const storedConfig = typeof configRow.setting_value === 'string'
            ? JSON.parse(configRow.setting_value)
            : configRow.setting_value

          if (!resolvedClientId && storedConfig?.clientId) {
            resolvedClientId = storedConfig.clientId
          }

          if (!resolvedMode && storedConfig?.mode) {
            resolvedMode = storedConfig.mode
          }
        } catch (_error) {
          // Ignore parse failures and fall back to defaults
        }
      }
    }

    if (!resolvedClientSecret) {
      const { data: secretValue } = await serviceClient.rpc('get_platform_secret_value', {
        key_name: 'paypal_client_secret',
      })

      if (typeof secretValue === 'string' && secretValue.length > 0) {
        resolvedClientSecret = secretValue
      }
    }

    // Allow admins to supply credentials dynamically for verification/testing
    if (client_id && client_secret) {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('Authorization header required when providing custom credentials')
      }

      const authSupabase = createClient(supabaseUrl, serviceRoleKey, {
        global: { headers: { Authorization: authHeader } },
      })

      const { data: { user }, error: userError } = await authSupabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      const { data: isAdmin, error: adminError } = await authSupabase.rpc('verify_admin_status')
      if (adminError || !isAdmin) {
        throw new Error('Admin privileges required to override PayPal credentials')
      }

      resolvedClientId = client_id
      resolvedClientSecret = client_secret
      resolvedMode = mode || resolvedMode
    }

    if (!resolvedClientId || !resolvedClientSecret) {
      throw new Error('PayPal credentials not configured')
    }

    // PayPal OAuth endpoint
    const baseUrl = resolvedMode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

    // Get access token
    const authString = btoa(`${resolvedClientId}:${resolvedClientSecret}`)
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`PayPal OAuth failed: ${error}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        scope: data.scope
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('PayPal OAuth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})