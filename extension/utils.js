export async function ensureSettingsLoaded() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ['openai_api_key', 'openai_base_url', 'openai_model', 'supabase_url', 'supabase_anon_key', 'use_supabase_key'],
      () => resolve()
    );
  });
}

export async function getSetting(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get([key], (result) => resolve(result?.[key]));
  });
}

export async function setSetting(key, value) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => resolve());
  });
}

// Function to get OpenAI API key from Supabase
export async function getSupabaseOpenAIKey() {
  const supabaseUrl = await getSetting('supabase_url');
  const supabaseAnonKey = await getSetting('supabase_anon_key');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }
  
  try {
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
    
    return configuration.api_key;
  } catch (error) {
    console.error('Failed to fetch OpenAI key from Supabase:', error);
    throw error;
  }
}

// Function to test Supabase connection
export async function testSupabaseConnection() {
  const supabaseUrl = await getSetting('supabase_url');
  const supabaseAnonKey = await getSetting('supabase_anon_key');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: 'Supabase credentials not configured' };
  }
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/admin_ai_providers?select=count&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      return { success: true, message: 'Supabase connection successful' };
    } else {
      return { success: false, error: `Connection failed: ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

