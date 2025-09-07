import { ensureSettingsLoaded, getSetting, setSetting, testSupabaseConnection } from './utils.js';

async function load() {
  await ensureSettingsLoaded();
  document.getElementById('use_supabase_key').checked = (await getSetting('use_supabase_key')) !== false; // Default to true
  document.getElementById('openai_api_key').value = (await getSetting('openai_api_key')) || '';
  document.getElementById('openai_base_url').value = (await getSetting('openai_base_url')) || 'https://api.openai.com';
  document.getElementById('openai_model').value = (await getSetting('openai_model')) || 'gpt-4o-mini';
  document.getElementById('supabase_url').value = (await getSetting('supabase_url')) || '';
  document.getElementById('supabase_anon_key').value = (await getSetting('supabase_anon_key')) || '';
  
  // Update UI based on checkbox state
  updateUIState();
}

function updateUIState() {
  const useSupabase = document.getElementById('use_supabase_key').checked;
  const supabaseInputs = ['supabase_url', 'supabase_anon_key'];
  const localInputs = ['openai_api_key'];
  
  // Enable/disable inputs based on checkbox state
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

