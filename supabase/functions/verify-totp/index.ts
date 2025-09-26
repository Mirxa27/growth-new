import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import * as OTPAuth from 'https://deno.land/x/otpauth@1.0.1/dist/index.ts'

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

    const { token: totpToken } = await req.json()

    if (!totpToken || totpToken.length !== 6) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the setup data
    const { data: setupData, error: setupError } = await supabase
      .from('user_2fa_setup')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (setupError || !setupData) {
      return new Response(
        JSON.stringify({ error: 'No pending 2FA setup found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if setup is expired
    if (new Date(setupData.expires_at) < new Date()) {
      await supabase
        .from('user_2fa_setup')
        .delete()
        .eq('user_id', user.id)

      return new Response(
        JSON.stringify({ error: 'Setup expired. Please start over.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify the token
    const totp = new OTPAuth.TOTP({
      issuer: 'Newomen.me',
      label: user.email!,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(setupData.totp_secret),
    })

    const delta = totp.validate({ token: totpToken })

    if (delta === null) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Enable 2FA for the user
    await supabase
      .from('user_profiles')
      .update({
        two_factor_enabled: true,
        two_factor_method: 'totp',
        two_factor_secret: setupData.totp_secret,
        backup_codes: setupData.backup_codes,
        two_factor_backup_codes_used: [],
        two_factor_enabled_at: new Date().toISOString()
      })
      .eq('id', user.id)

    // Clean up setup data
    await supabase
      .from('user_2fa_setup')
      .delete()
      .eq('user_id', user.id)

    // Log the security event
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: '2fa_enabled',
        resource_type: 'security',
        details: { method: 'totp' },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error verifying TOTP:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})