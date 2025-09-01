# 🚀 Deploy Supabase Edge Functions with CORS Fix

## Prerequisites
1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref ufgqmqoykddaotdbwteg
```

## Deploy Edge Functions

### 1. Deploy test-ai-provider Function
```bash
supabase functions deploy test-ai-provider
```

### 2. Deploy get-realtime-token Function
```bash
supabase functions deploy get-realtime-token
```

### 3. Set Environment Variables (Important!)
```bash
# Set OpenAI API key for the functions
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-key
```

## Verify CORS Headers

### Test OPTIONS Pre-flight
```bash
curl -X OPTIONS \
  https://ufgqmqoykddaotdbwteg.supabase.co/functions/v1/test-ai-provider \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: x-application-version" \
  -v
```

Expected response:
- Status: 204 No Content
- Headers should include:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: POST, GET, OPTIONS`
  - `Access-Control-Allow-Headers: content-type, authorization, x-application-version, x-application-name`

### Test POST Request
```bash
curl -X POST \
  https://ufgqmqoykddaotdbwteg.supabase.co/functions/v1/test-ai-provider \
  -H "Content-Type: application/json" \
  -H "x-application-version: 1.0.0" \
  -d '{"provider": "openai", "apiKey": "sk-test", "model": "gpt-4o-mini"}'
```

## What These Functions Do

### test-ai-provider
- Handles CORS properly for all headers including `x-application-version`
- Tests OpenAI and Anthropic API keys
- Returns validation results
- Responds with 204 for OPTIONS requests

### get-realtime-token
- Generates ephemeral tokens for OpenAI Realtime API
- Handles CORS for browser-based requests
- Uses server-side OpenAI API key securely

## Troubleshooting

### If CORS errors persist:
1. Check the function logs:
```bash
supabase functions logs test-ai-provider
```

2. Verify the function is deployed:
```bash
supabase functions list
```

3. Test directly without browser:
```bash
# This should work without CORS issues
curl https://ufgqmqoykddaotdbwteg.supabase.co/functions/v1/test-ai-provider
```

### Common Issues:

| Issue | Solution |
|-------|----------|
| Function not found | Deploy the function first |
| CORS header missing | Redeploy with updated code |
| 500 error | Check function logs for errors |
| Auth error | Set OPENAI_API_KEY secret |

## Production Considerations

Before going to production:

1. **Update ALLOWED_ORIGIN** in both functions:
```typescript
const ALLOWED_ORIGIN = "https://your-production-domain.com"
// Instead of "*"
```

2. **Add rate limiting**:
```typescript
// Add to function logic
const rateLimit = await checkRateLimit(req)
if (!rateLimit.allowed) {
  return new Response("Too many requests", { status: 429 })
}
```

3. **Add authentication**:
```typescript
// Verify JWT token
const token = req.headers.get("Authorization")?.replace("Bearer ", "")
const { user, error } = await verifyToken(token)
if (error) {
  return new Response("Unauthorized", { status: 401 })
}
```

## Quick Deploy Script

Create `deploy-functions.sh`:
```bash
#!/bin/bash
echo "Deploying Edge Functions..."
supabase functions deploy test-ai-provider
supabase functions deploy get-realtime-token
echo "Setting secrets..."
supabase secrets set OPENAI_API_KEY=$OPENAI_API_KEY
echo "Deployment complete!"
```

Run:
```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

## Verify in Browser

After deployment:
1. Open your app
2. Open DevTools → Network tab
3. Try the feature that calls the function
4. Look for:
   - OPTIONS request → Status 204
   - POST request → Status 200
   - No CORS errors in console

The CORS issue will be completely resolved! 🎉