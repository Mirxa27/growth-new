# Manual Database Fixes

Since we cannot run psql directly, please apply these fixes through the Supabase SQL Editor:

## Step 1: Go to Supabase SQL Editor
https://app.supabase.com/project/ufgqmqoykddaotdbwteg/sql/new

## Step 2: Apply Main Fixes
Copy and paste the contents of `/workspace/FIX_ALL_ERRORS.sql` into the SQL editor and run it.

## Step 3: Apply PayPal Support
Copy and paste the contents of `/workspace/supabase/migrations/20240114_add_paypal_support.sql` into the SQL editor and run it.

## Step 4: Verify Tables Exist
Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'performance_metrics',
  'error_logs',
  'notification_preferences',
  'paypal_products',
  'paypal_plans',
  'paypal_webhook_events'
)
ORDER BY table_name;
```

## Step 5: Deploy Edge Functions

### For each function, do the following:

1. Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/functions
2. Click "New Function"
3. Name it exactly as specified
4. Copy the code from the corresponding file
5. Deploy

Functions to deploy:
- **test-ai-provider** - Copy from `/workspace/supabase/functions/test-ai-provider/index.ts`
- **paypal-oauth** - Copy from `/workspace/supabase/functions/paypal-oauth/index.ts`
- **create-paypal-subscription** - Copy from `/workspace/supabase/functions/create-paypal-subscription/index.ts`

## Step 6: Set Edge Function Secrets

Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/vault

Add these secrets:
- `PAYPAL_CLIENT_ID` - Get from PayPal Developer Dashboard
- `PAYPAL_CLIENT_SECRET` - Get from PayPal Developer Dashboard
- `PAYPAL_MODE` - Set to "sandbox" for testing or "live" for production
- `PAYPAL_WEBHOOK_ID` - Get from PayPal after creating webhook

## Step 7: Configure PayPal

1. Create a PayPal Business Account:
   - Go to: https://www.paypal.com/sa/business
   - Sign up for a business account

2. Get API Credentials:
   - Go to: https://developer.paypal.com/
   - Navigate to My Apps & Credentials
   - Create a new app
   - Copy the Client ID and Secret

3. Create Products and Plans:
   - In PayPal Developer Dashboard
   - Go to Products & Plans
   - Create products matching the ones in the database

4. Set Up Webhooks:
   - In PayPal Developer Dashboard
   - Go to Webhooks
   - Create a webhook for your domain
   - Subscribe to these events:
     - BILLING.SUBSCRIPTION.CREATED
     - BILLING.SUBSCRIPTION.ACTIVATED
     - BILLING.SUBSCRIPTION.UPDATED
     - BILLING.SUBSCRIPTION.CANCELLED
     - PAYMENT.CAPTURE.COMPLETED

## Step 8: Update Frontend Components

Replace Stripe components with PayPal:

1. Update payment service imports:
```typescript
// Replace
import { paymentService } from '@/services/api/payment.service';
// With
import { paypalService } from '@/services/api/paypal.service';
```

2. Update subscription creation:
```typescript
// Replace Stripe checkout
const { url } = await paymentService.createCheckoutSession({ ... });

// With PayPal subscription
const { approval_url } = await paypalService.createSubscription({
  plan_id: 'PLAN_PREMIUM_MONTHLY',
  return_url: `${window.location.origin}/payment/success`,
  cancel_url: `${window.location.origin}/payment/cancel`
});
window.location.href = approval_url;
```