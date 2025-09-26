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

    const { code } = await req.json()

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Backup code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.two_factor_enabled || !profile.backup_codes) {
      return new Response(
        JSON.stringify({ error: '2FA not enabled or no backup codes available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if backup code is valid and not used
    const usedCodes = profile.two_factor_backup_codes_used || []
    const availableCodes = profile.backup_codes.filter((backupCode: string) => !usedCodes.includes(backupCode))

    if (!availableCodes.includes(code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or already used backup code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Mark backup code as used
    const newUsedCodes = [...usedCodes, code]
    await supabase
      .from('user_profiles')
      .update({
        two_factor_backup_codes_used: newUsedCodes,
        two_factor_last_used: new Date().toISOString()
      })
      .eq('id', user.id)

    // Log successful backup code verification
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: '2fa_backup_code_verified',
        resource_type: 'security',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error verifying backup code:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})