# 🔍 Troubleshooting OpenAI API Key Issues

## Quick Diagnosis

### 1. Open Browser Console and Run:
```javascript
// Copy and paste this entire block
console.log('API Key Check:');
console.log('1. Exists:', !!import.meta.env.VITE_OPENAI_API_KEY);
console.log('2. Prefix:', import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 7));
console.log('3. Length:', import.meta.env.VITE_OPENAI_API_KEY?.length);

// Test the key
if (import.meta.env.VITE_OPENAI_API_KEY) {
  fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` }
  }).then(r => {
    console.log('4. API Status:', r.status);
    if (r.status === 401) console.error('❌ Key is invalid');
    if (r.status === 200) console.log('✅ Key is valid');
  });
}
```

### 2. Go to Admin Panel
Navigate to `/admin` → Settings → You'll see the new "API Key Diagnostics" card at the top.

## Common Issues & Solutions

### Issue 1: Environment Variable Not Loading

**Symptoms:**
- `import.meta.env.VITE_OPENAI_API_KEY` is undefined
- 401 errors persist

**Solutions:**

#### For Local Development:
1. **Check .env file location** - Must be in project root (same level as package.json)
```
/workspace/
├── .env          ← Here, not in src/
├── package.json
├── src/
```

2. **Check .env format** - No quotes, no spaces
```env
# ✅ Correct
VITE_OPENAI_API_KEY=sk-abc123xyz789

# ❌ Wrong
VITE_OPENAI_API_KEY="sk-abc123xyz789"  # No quotes
VITE_OPENAI_API_KEY = sk-abc123xyz789   # No spaces
OPENAI_API_KEY=sk-abc123xyz789          # Must start with VITE_
```

3. **Restart dev server** - Environment variables are loaded at startup
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

#### For Vercel Production:
1. **Check environment variables in Vercel:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Settings → Environment Variables
   - Ensure `VITE_OPENAI_API_KEY` is set

2. **Redeploy after adding:**
```bash
vercel --prod --force
```

### Issue 2: Invalid API Key

**Symptoms:**
- Key exists but still getting 401
- Key doesn't start with "sk-"

**Solutions:**
1. **Get a new key from OpenAI:**
   - Go to: https://platform.openai.com/api-keys
   - Create new secret key
   - Copy immediately (won't show again)

2. **Check billing:**
   - Go to: https://platform.openai.com/account/billing
   - Ensure you have credits or active subscription

3. **Check key format:**
   - Must start with `sk-`
   - Should be ~51 characters long
   - No extra spaces or characters

### Issue 3: Key Works in Test but Not in App

**Symptoms:**
- Direct API test works
- App still shows errors

**Solutions:**
1. **Clear browser cache:**
```bash
# Hard refresh
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

2. **Check multiple places where key might be cached:**
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

3. **Verify the key is being used:**
```javascript
// Add this temporarily to src/services/chat.service.ts
console.log('Using API key:', this.apiKey?.substring(0, 7));
```

## Step-by-Step Verification

### Step 1: Verify File Structure
```bash
ls -la | grep .env
# Should show: .env
```

### Step 2: Verify Content
```bash
cat .env | grep VITE_OPENAI
# Should show: VITE_OPENAI_API_KEY=sk-...
```

### Step 3: Test in New Terminal
```bash
# Load env and test
source .env
echo $VITE_OPENAI_API_KEY
# Should show your key
```

### Step 4: Test API Directly
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY_HERE" \
  -H "Content-Type: application/json"
```

## Debug Checklist

- [ ] `.env` file exists in project root
- [ ] Key starts with `VITE_` prefix
- [ ] Key format is `sk-...` (no quotes)
- [ ] Dev server restarted after adding key
- [ ] Browser cache cleared
- [ ] No typos in variable name
- [ ] Key has valid credits/subscription
- [ ] If Vercel: Environment variable added and redeployed

## Still Not Working?

### Create a Test File
Create `test-key.mjs` in project root:
```javascript
import dotenv from 'dotenv';
dotenv.config();

console.log('Key exists:', !!process.env.VITE_OPENAI_API_KEY);
console.log('Key prefix:', process.env.VITE_OPENAI_API_KEY?.substring(0, 7));

// Test the key
fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
  }
}).then(r => {
  console.log('API Status:', r.status);
  process.exit(0);
});
```

Run:
```bash
node test-key.mjs
```

### Manual Override (Temporary)
As a last resort, temporarily hardcode the key to test:
```javascript
// In src/config/environment.ts (REMOVE AFTER TESTING!)
openai: {
  apiKey: 'sk-your-actual-key-here', // TEMPORARY - REMOVE!
  // ... rest
}
```

## Contact Support
If none of these solutions work:
1. Share the output from the API Key Diagnostics panel
2. Share browser console errors
3. Share your `.env` file structure (without the actual key)
4. Share the deployment method (local/Vercel)