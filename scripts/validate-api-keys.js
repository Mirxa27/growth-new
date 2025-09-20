#!/usr/bin/env node

import { config } from 'dotenv';
import fetch from 'node-fetch';

config({ path: '.env.local' });

const validateOpenAIKey = async (apiKey) => {
  if (!apiKey) {
    return { valid: false, error: 'API key not provided' };
  }

  if (!apiKey.startsWith('sk-')) {
    return { valid: false, error: 'Invalid API key format. Must start with sk-' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key or insufficient permissions' };
    }

    if (response.status === 429) {
      return { valid: true, warning: 'API key valid but rate limited' };
    }

    if (response.ok) {
      return { valid: true, message: 'API key is valid and working' };
    }

    return { valid: false, error: `API returned status ${response.status}` };
  } catch (error) {
    return { valid: false, error: `Network error: ${error.message}` };
  }
};

const main = async () => {
  console.log('🔑 Validating API Keys...\n');

  const openaiKey = process.env.OPENAI_API_KEY;
  
  if (openaiKey) {
    console.log('🔍 Checking OpenAI API key...');
    const result = await validateOpenAIKey(openaiKey);
    
    if (result.valid) {
      console.log('✅ OpenAI API key is valid');
      if (result.warning) {
        console.log(`⚠️ Warning: ${result.warning}`);
      }
    } else {
      console.log(`❌ OpenAI API key invalid: ${result.error}`);
      console.log('💡 Get a valid key from: https://platform.openai.com/account/api-keys');
    }
  } else {
    console.log('⚠️ OpenAI API key not configured');
    console.log('💡 Set OPENAI_API_KEY in your .env.local file');
  }

  console.log('\n🔑 API key validation complete');
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
