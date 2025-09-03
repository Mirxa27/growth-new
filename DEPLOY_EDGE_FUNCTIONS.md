# Deploying Edge Functions to Fix CORS and Voice Chat Issues

## Prerequisites
- Supabase CLI installed globally
- Access to your Supabase project

## Installation

1. Install Supabase CLI (if not already installed):
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

## Deployment Steps

1. Navigate to your project directory:
```bash
cd /workspace
```

2. Link to your Supabase project:
```bash
supabase link --project-ref ufgqmqoykddaotdbwteg
```

3. Deploy the edge functions:

```bash
# Deploy get-realtime-token function
supabase functions deploy get-realtime-token --no-verify-jwt

# Deploy realtime-voice-proxy function  
supabase functions deploy realtime-voice-proxy --no-verify-jwt

# Deploy create-checkout-session function
supabase functions deploy create-checkout-session --no-verify-jwt

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook --no-verify-jwt
```

## Setting Secrets

After deploying, you need to set the following secrets in your Supabase Dashboard:

1. Go to: https://app.supabase.com/project/ufgqmqoykddaotdbwteg/settings/functions

2. Add these secrets:
   - `OPENAI_API_KEY`: Your OpenAI API key (required for voice chat)
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (optional, for payments)
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret (optional, for payments)

## Applying Database Migrations

Run the latest migrations to fix the notification_preferences and performance_metrics tables:

```bash
supabase db push --db-url "postgresql://postgres:Mirxa420\$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres"
```

Or apply individual migration files:

```bash
supabase migration up --db-url "postgresql://postgres:Mirxa420\$@db.ufgqmqoykddaotdbwteg.supabase.co:5432/postgres"
```

## Verifying Deployment

1. Check edge functions are deployed:
```bash
supabase functions list
```

2. Test the realtime token endpoint:
```bash
curl -X POST https://ufgqmqoykddaotdbwteg.supabase.co/functions/v1/get-realtime-token \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### CORS Errors
- Ensure the `_shared/cors.ts` file includes all necessary headers
- Check that functions are deployed with `--no-verify-jwt` flag

### 406 Not Acceptable Errors
- Run the notification_preferences migration
- Check RLS policies are properly set

### Voice Chat Not Working
- Verify OPENAI_API_KEY is set in edge function secrets
- Check browser console for specific errors
- Try the WebSocket fallback option in the UI