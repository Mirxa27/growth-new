// Options page script for Chrome Extension MV3
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

function setSetting(key, value) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [key]: value }, () => resolve());
  });
}

function testSupabaseConnection() {
  return new Promise(async (resolve) => {
    try {
      const supabaseUrl = await getSetting('supabase_url');
      const supabaseAnonKey = await getSetting('supabase_anon_key');
      
      if (!supabaseUrl || !supabaseAnonKey) {
        resolve({ success: false, error: 'Supabase credentials not configured' });
        return;
      }
      
      const response = await fetch(`${supabaseUrl}/rest/v1/admin_ai_providers?select=count&limit=1`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        resolve({ success: true, message: 'Supabase connection successful' });
      } else {
        resolve({ success: false, error: `Connection failed: ${response.status}` });
      }
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

async function load() {
  await ensureSettingsLoaded();
  document.getElementById('use_supabase_key').checked = (await getSetting('use_supabase_key')) !== false;
  document.getElementById('openai_api_key').value = (await getSetting('openai_api_key')) || '';
  document.getElementById('openai_base_url').value = (await getSetting('openai_base_url')) || 'https://api.openai.com';
  document.getElementById('openai_model').value = (await getSetting('openai_model')) || 'gpt-4o-mini';
  document.getElementById('supabase_url').value = (await getSetting('supabase_url')) || '';
  document.getElementById('supabase_anon_key').value = (await getSetting('supabase_anon_key')) || '';
  
  updateUIState();
}

function updateUIState() {
  const useSupabase = document.getElementById('use_supabase_key').checked;
  const supabaseInputs = ['supabase_url', 'supabase_anon_key'];
  const localInputs = ['openai_api_key'];
  
  supabaseInputs.forEach(id => {
    document.getElementById(id).style.opacity = useSupabase ? '1' : '0.5';
  });
  
  localInputs.forEach(id => {
    document.getElementById(id).style.opacity = useSupabase ? '0.5' : '1';
  });
}

async function save() {
  await setSetting('use_supabase_key', document.getElementById('use_supabase_key').checked);
  await setSetting('openai_api_key', document.getElementById('openai_api_key').value.trim());
  await setSetting('openai_base_url', document.getElementById('openai_base_url').value.trim());
  await setSetting('openai_model', document.getElementById('openai_model').value.trim());
  await setSetting('supabase_url', document.getElementById('supabase_url').value.trim());
  await setSetting('supabase_anon_key', document.getElementById('supabase_anon_key').value.trim());
  
  const el = document.getElementById('status');
  el.textContent = 'Saved';
  el.style.color = '#10b981';
  setTimeout(() => {
    el.textContent = '';
    el.style.color = '';
  }, 1500);
}

// Event listeners
document.getElementById('use_supabase_key').addEventListener('change', updateUIState);
document.getElementById('save').addEventListener('click', save);

document.getElementById('test').addEventListener('click', async () => {
  const el = document.getElementById('status');
  el.textContent = 'Testing OpenAI connection...';
  el.style.color = '#3b82f6';
  
  const response = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'openai:models' }, resolve);
  });
  
  if (response?.error) {
    el.textContent = `OpenAI Error: ${response.error}`;
    el.style.color = '#ef4444';
  } else {
    el.textContent = `OpenAI OK: ${response?.status || 'Connected'}`;
    el.style.color = '#10b981';
  }
  
  setTimeout(() => {
    el.textContent = '';
    el.style.color = '';
  }, 3000);
});

document.getElementById('test_supabase').addEventListener('click', async () => {
  const el = document.getElementById('status');
  el.textContent = 'Testing Supabase connection...';
  el.style.color = '#3b82f6';
  
  const result = await testSupabaseConnection();
  
  if (result.success) {
    el.textContent = `Supabase OK: ${result.message}`;
    el.style.color = '#10b981';
  } else {
    el.textContent = `Supabase Error: ${result.error}`;
    el.style.color = '#ef4444';
  }
  
  setTimeout(() => {
    el.textContent = '';
    el.style.color = '';
  }, 3000);
});

load();