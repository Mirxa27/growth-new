// Background service worker for Chrome Extension MV3
// Traditional script approach - no ES modules

// Utility functions (inline)
function ensureSettingsLoaded() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ['openai_api_key', 'openai_base_url', 'openai_model', 'supabase_url', 'supabase_anon_key', 'use_supabase_key'],
      () => resolve()
    );
  });
}

function getSetting(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => resolve(result?.[key]));
  });
}

function getSupabaseOpenAIKey() {
  return new Promise(async (resolve, reject) => {
    try {
      const supabaseUrl = await getSetting('supabase_url');
      const supabaseAnonKey = await getSetting('supabase_anon_key');
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase credentials not configured');
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/admin_ai_providers?provider_type=eq.openai&is_active=eq.true&select=configuration&limit=1`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Supabase request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('No active OpenAI provider found in Supabase');
      }
      
      const configuration = data[0].configuration;
      if (!configuration || !configuration.api_key) {
        throw new Error('OpenAI API key not found in provider configuration');
      }
      
      resolve(configuration.api_key);
    } catch (error) {
      console.error('Failed to fetch OpenAI key from Supabase:', error);
      reject(error);
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  // Initialize defaults
  chrome.storage.sync.set({
    openai_base_url: 'https://api.openai.com',
    openai_model: 'gpt-4o-mini',
    use_supabase_key: true, // Default to using Supabase key
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      // Validate sender and tab existence
      if (sender.tab && sender.frameId !== undefined) {
        try {
          // Check if frame still exists before processing
          await chrome.tabs.get(sender.tab.id);
        } catch (error) {
          console.warn('Tab or frame no longer exists:', error.message);
          return; // Don't send response for non-existent frames
        }
      }

      await ensureSettingsLoaded();
      
      if (message?.type === 'healthcheck') {
        sendResponse({ status: 'ok', model: await getSetting('openai_model') });
        return;
      }
      
      if (message?.type === 'openai:models') {
        const useSupabaseKey = await getSetting('use_supabase_key');
        let apiKey;
        
        if (useSupabaseKey) {
          // Try to get OpenAI key from Supabase
          try {
            apiKey = await getSupabaseOpenAIKey();
          } catch (supabaseError) {
            console.warn('Failed to get Supabase OpenAI key, falling back to local storage:', supabaseError);
            apiKey = await getSetting('openai_api_key');
          }
        } else {
          // Use local storage key
          apiKey = await getSetting('openai_api_key');
        }
        
        const baseUrl = (await getSetting('openai_base_url')) || 'https://api.openai.com';
        
        if (!apiKey) {
          sendResponse({ error: 'missing_api_key', details: 'No OpenAI API key found in Supabase or local storage' });
          return;
        }
        
        try {
          const resp = await fetch(`${baseUrl}/v1/models`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          const data = await resp.json();
          sendResponse({ status: resp.status, data });
        } catch (fetchError) {
          sendResponse({ error: 'api_request_failed', details: String(fetchError) });
        }
        return;
      }
      
      // Handle unknown message types
      sendResponse({ error: 'unknown_message_type' });
    } catch (error) {
      console.error('Background error', error);
      // Only send response if sender still exists
      if (sender.tab) {
        try {
          sendResponse({ error: String(error) });
        } catch (responseError) {
          console.warn('Failed to send error response:', responseError.message);
        }
      }
    }
  })();
  return true; // Keep message channel open for async response
});