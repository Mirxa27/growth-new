import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface PayPalPlanRequest {
  name: string;
  description: string;
  price: string;
  currency: string;
  interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  interval_count: number;
}

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
    const planData: PayPalPlanRequest = await req.json();

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

    // First, create a product (required for subscription plans)
    const productPayload = {
      name: planData.name,
      description: planData.description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    };

    const productResponse = await fetch(`${baseUrl}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
        'PayPal-Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify(productPayload),
    });

    if (!productResponse.ok) {
      const errorData = await productResponse.json();
      console.error('Product creation error:', errorData);
      throw new Error('Failed to create PayPal product');
    }

    const productData = await productResponse.json();

    // Now create the subscription plan
    const planPayload = {
      product_id: productData.id,
      name: planData.name,
      description: planData.description,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: planData.interval,
            interval_count: planData.interval_count,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          pricing_scheme: {
            fixed_price: {
              value: planData.price,
              currency_code: planData.currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    };

    const planResponse = await fetch(`${baseUrl}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
        'PayPal-Request-Id': crypto.randomUUID(),
      },
      body: JSON.stringify(planPayload),
    });

    if (!planResponse.ok) {
      const errorData = await planResponse.json();
      console.error('Plan creation error:', errorData);
      throw new Error('Failed to create PayPal plan');
    }

    const createdPlan = await planResponse.json();

    // Store plan in database
    const { error: dbError } = await supabaseClient
      .from('paypal_plans')
      .insert({
        id: createdPlan.id,
        name: planData.name,
        description: planData.description,
        status: createdPlan.status,
        price: parseFloat(planData.price),
        currency: planData.currency,
        interval: planData.interval,
        interval_count: planData.interval_count,
        product_id: productData.id,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store plan in database');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        plan: createdPlan,
        message: 'Plan created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Create PayPal plan error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create PayPal plan' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});