import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

Deno.serve(async (req) => {
  // Webhooks don't need CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Stripe webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    
    if (!webhookSecret || !stripeKey) {
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'No signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.text()
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(supabase, session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(supabase, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(supabase, invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCheckoutCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const planId = session.metadata?.plan_id
  
  if (!userId || !planId) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Create subscription record
  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      payment_gateway: 'stripe',
      payment_gateway_subscription_id: session.subscription,
      payment_method: 'card',
      started_at: new Date().toISOString(),
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

  if (error) {
    console.error('Error creating subscription:', error)
  }

  // Update user profile
  await supabase
    .from('profiles')
    .update({ subscription_tier: 'premium' })
    .eq('id', userId)
}

async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('payment_gateway_subscription_id', subscription.id)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  const { data: userSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('payment_gateway_subscription_id', subscription.id)
    .single()

  if (userSub) {
    // Update subscription status
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('payment_gateway_subscription_id', subscription.id)

    // Update user profile
    await supabase
      .from('profiles')
      .update({ subscription_tier: 'free' })
      .eq('id', userSub.user_id)
  }
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription
  const amount = invoice.amount_paid / 100 // Convert from cents

  // Record payment
  const { error } = await supabase
    .from('payments')
    .insert({
      amount,
      currency: invoice.currency,
      status: 'completed',
      gateway_payment_id: invoice.id,
      payment_date: new Date().toISOString(),
      payment_method: 'card',
      subscription_id: subscriptionId,
    })

  if (error) {
    console.error('Error recording payment:', error)
  }
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription

  // Record failed payment
  const { error } = await supabase
    .from('payment_failures')
    .insert({
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      error_code: 'payment_failed',
      error_message: 'Payment failed',
      gateway_reference: invoice.id,
      subscription_id: subscriptionId,
      failed_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error recording payment failure:', error)
  }

  // Update subscription status if needed
  if (invoice.billing_reason === 'subscription_cycle') {
    await supabase
      .from('user_subscriptions')
      .update({ status: 'past_due' })
      .eq('payment_gateway_subscription_id', subscriptionId)
  }
}