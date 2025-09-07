// Test script for Chrome extension Supabase integration
// This can be run in the browser console on the extension options page

async function testSupabaseIntegration() {
  console.log('🧪 Testing Chrome Extension Supabase Integration...');
  
  try {
    // Import utils
    const utils = await import('./utils.js');
    
    // Test 1: Check if Supabase credentials are configured
    console.log('📋 Test 1: Checking Supabase credentials...');
    const supabaseUrl = await utils.getSetting('supabase_url');
    const supabaseAnonKey = await utils.getSetting('supabase_anon_key');
    const useSupabaseKey = await utils.getSetting('use_supabase_key');
    
    console.log('Supabase URL:', supabaseUrl ? '✅ Configured' : '❌ Missing');
    console.log('Supabase Anon Key:', supabaseAnonKey ? '✅ Configured' : '❌ Missing');
    console.log('Use Supabase Key:', useSupabaseKey ? '✅ Enabled' : '❌ Disabled');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase credentials not configured. Please set them in the options page.');
      return false;
    }
    
    // Test 2: Test Supabase connection
    console.log('🔗 Test 2: Testing Supabase connection...');
    const connectionResult = await utils.testSupabaseConnection();
    
    if (connectionResult.success) {
      console.log('✅ Supabase connection successful:', connectionResult.message);
    } else {
      console.error('❌ Supabase connection failed:', connectionResult.error);
      return false;
    }
    
    // Test 3: Try to fetch OpenAI key from Supabase
    console.log('🔑 Test 3: Fetching OpenAI key from Supabase...');
    try {
      const openaiKey = await utils.getSupabaseOpenAIKey();
      console.log('✅ OpenAI key retrieved successfully');
      console.log('Key format:', openaiKey ? `${openaiKey.substring(0, 7)}...` : 'Empty');
    } catch (error) {
      console.error('❌ Failed to fetch OpenAI key:', error.message);
      return false;
    }
    
    // Test 4: Test OpenAI API call through background script
    console.log('🤖 Test 4: Testing OpenAI API call...');
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'openai:models' }, resolve);
    });
    
    if (response?.error) {
      console.error('❌ OpenAI API test failed:', response.error);
      return false;
    } else {
      console.log('✅ OpenAI API test successful');
      console.log('Status:', response?.status);
      console.log('Models count:', response?.data?.data?.length || 0);
    }
    
    console.log('🎉 All tests passed! Chrome extension Supabase integration is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    return false;
  }
}

// Run the test
testSupabaseIntegration().then(success => {
  if (success) {
    console.log('✅ Extension ready for use!');
  } else {
    console.log('❌ Please fix the issues above before using the extension.');
  }
});