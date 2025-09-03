import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

interface CheckoutRequest {
  planId: string
  userId: string
  successUrl: string
  cancelUrl: string
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const { planId, userId, successUrl, cancelUrl }: CheckoutRequest = await req.json()

    // Get subscription plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user details
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', userId)
      .single()

    // Get Stripe configuration
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: profile?.email,
      line_items: [
        {
          price_data: {
            currency: plan.currency || 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
              metadata: {
                plan_id: plan.id,
              },
            },
            unit_amount: Math.round(plan.price * 100), // Convert to cents
            recurring: {
              interval: plan.billing_period === 'yearly' ? 'year' : 
                       plan.billing_period === 'quarterly' ? 'month' : 'month',
              interval_count: plan.billing_period === 'quarterly' ? 3 : 1,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
        plan_id: planId,
      },
      subscription_data: {
        trial_period_days: plan.trial_days || undefined,
        metadata: {
          user_id: userId,
          plan_id: planId,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })

    return new Response(
      JSON.stringify({
        id: session.id,
        url: session.url,
        success_url: session.success_url,
        cancel_url: session.cancel_url,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})