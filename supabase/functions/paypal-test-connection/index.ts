import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayPalTestRequest {
  clientId: string
  clientSecret: string
  mode: 'sandbox' | 'live'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { clientId, clientSecret, mode }: PayPalTestRequest = await req.json()

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Client ID and Client Secret are required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // PayPal OAuth endpoint
    const paypalBaseUrl = mode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    // Test PayPal connection by getting an access token
    const authResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error('PayPal auth error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `PayPal authentication failed: ${authResponse.status} ${authResponse.statusText}` 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const authData = await authResponse.json()
    
    if (!authData.access_token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to obtain PayPal access token' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Test API access by fetching account info
    const accountResponse = await fetch(`${paypalBaseUrl}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Accept': 'application/json',
      }
    })

    if (accountResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully connected to PayPal ${mode} environment` 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `PayPal API test failed: ${accountResponse.status} ${accountResponse.statusText}` 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('PayPal test connection error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Connection test failed: ${error.message}` 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})