import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import * as OTPAuth from 'https://deno.land/x/otpauth@1.0.1/dist/index.ts'
import { QRCode } from 'https://deno.land/x/qrcode@v2.0.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Generate TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: 'Newomen.me',
      label: user.email!,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(OTPAuth.Secret.generate()),
    })

    const secret = totp.secret.base32
    const url = totp.toString()

    // Generate QR code
    const qrCode = await QRCode.toDataURL(url)

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 15).toUpperCase()
    )

    // Store the setup data temporarily (in production, use a proper temp storage)
    await supabase
      .from('user_2fa_setup')
      .upsert({
        user_id: user.id,
        totp_secret: secret,
        backup_codes: backupCodes,
        expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      })

    return new Response(
      JSON.stringify({
        setup: {
          secret,
          qrCodeUrl: qrCode,
          backupCodes
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error generating TOTP setup:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})