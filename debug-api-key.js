/**
 * Debug script to check API key configuration
 * Run this in browser console to diagnose issues
 */

console.log('=== API Key Debug ===');

// 1. Check if environment variable is loaded
const apiKey = import.meta.env?.VITE_OPENAI_API_KEY;
console.log('1. API Key exists:', !!apiKey);
console.log('2. API Key prefix:', apiKey?.substring(0, 7) + '...');
console.log('3. API Key length:', apiKey?.length);

// 2. Check all env vars
console.log('\n4. All VITE env vars:');
Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')).forEach(key => {
  const value = import.meta.env[key];
  if (key.includes('KEY') || key.includes('SECRET')) {
    console.log(`  ${key}: ${value?.substring(0, 7)}... (length: ${value?.length})`);
  } else {
    console.log(`  ${key}: ${value}`);
  }
});

// 3. Test API directly
if (apiKey) {
  console.log('\n5. Testing OpenAI API...');
  fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  })
  .then(response => {
    console.log('6. API Response Status:', response.status);
    if (response.status === 401) {
      console.error('❌ API Key is invalid or expired');
      console.log('   - Check if key starts with "sk-"');
      console.log('   - Verify key in OpenAI dashboard: https://platform.openai.com/api-keys');
      console.log('   - Ensure billing is active: https://platform.openai.com/account/billing');
    } else if (response.ok) {
      console.log('✅ API Key is valid!');
    }
    return response.json();
  })
  .then(data => {
    if (data.error) {
      console.error('7. API Error:', data.error);
    } else {
      console.log('7. Available models:', data.data?.length || 0);
    }
  })
  .catch(err => {
    console.error('8. Network Error:', err);
  });
} else {
  console.error('❌ No API Key found in environment');
  console.log('\nTroubleshooting:');
  console.log('1. If local dev: Check .env file exists and contains VITE_OPENAI_API_KEY');
  console.log('2. If Vercel: Check environment variables in dashboard');
  console.log('3. After adding env var: Restart dev server or redeploy');
}

console.log('\n=== End Debug ===');