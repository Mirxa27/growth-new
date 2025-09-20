import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface PayPalAccessTokenResponse {
  access_token: string;
  expires_in: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get PayPal configuration
    const { data: configData } = await supabaseClient
      .from('admin_payment_settings')
      .select('configuration, is_active')
      .eq('provider', 'paypal')
      .single();

    if (!configData?.is_active) {
      return new Response(
        JSON.stringify({ error: 'PayPal is not configured or active' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const config = configData.configuration;
    const baseUrl = config.mode === 'live' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    // Get request data
    const { plan_id, status } = await req.json();

    if (!plan_id || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing plan_id or status' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Get PayPal access token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const tokenData: PayPalAccessTokenResponse = await tokenResponse.json();

    // Update plan status via PayPal API
    const updatePayload = [
      {
        op: 'replace',
        path: '/status',
        value: status,
      },
    ];

    const updateResponse = await fetch(`${baseUrl}/v1/billing/plans/${plan_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.error('Plan update error:', errorData);
      throw new Error('Failed to update PayPal plan');
    }

    // Update plan status in database
    const { error: dbError } = await supabaseClient
      .from('paypal_plans')
      .update({ status: status })
      .eq('id', plan_id);

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to update plan in database');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Plan status updated to ${status}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Update PayPal plan error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to update PayPal plan' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});