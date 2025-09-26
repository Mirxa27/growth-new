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

    const { token: verifyToken, method } = await req.json()

    if (!verifyToken || !method) {
      return new Response(
        JSON.stringify({ error: 'Token and method are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get user's 2FA settings
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.two_factor_enabled) {
      return new Response(
        JSON.stringify({ error: '2FA not enabled for this user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let isValid = false

    if (method === 'totp' && profile.two_factor_secret) {
      // Verify TOTP token
      const totp = new OTPAuth.TOTP({
        issuer: 'Newomen.me',
        label: user.email!,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(profile.two_factor_secret),
      })

      const delta = totp.validate({ token: verifyToken })
      isValid = delta !== null
    } else if (method === 'backup' && profile.backup_codes) {
      // Verify backup code
      const usedCodes = profile.two_factor_backup_codes_used || []
      const availableCodes = profile.backup_codes.filter((code: string) => !usedCodes.includes(code))

      isValid = availableCodes.includes(verifyToken)

      if (isValid) {
        // Mark backup code as used
        const newUsedCodes = [...usedCodes, verifyToken]
        await supabase
          .from('user_profiles')
          .update({ two_factor_backup_codes_used: newUsedCodes })
          .eq('id', user.id)
      }
    }

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Update last used timestamp
    await supabase
      .from('user_profiles')
      .update({ two_factor_last_used: new Date().toISOString() })
      .eq('id', user.id)

    // Log successful 2FA verification
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: '2fa_verified',
        resource_type: 'security',
        details: { method },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error verifying 2FA token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})