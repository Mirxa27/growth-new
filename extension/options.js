import { ensureSettingsLoaded, getSetting, setSetting } from './utils.js';

async function load() {
  await ensureSettingsLoaded();
  document.getElementById('openai_api_key').value = (await getSetting('openai_api_key')) || '';
  document.getElementById('openai_base_url').value = (await getSetting('openai_base_url')) || 'https://api.openai.com';
  document.getElementById('openai_model').value = (await getSetting('openai_model')) || 'gpt-4o-mini';
  document.getElementById('supabase_url').value = (await getSetting('supabase_url')) || '';
  document.getElementById('supabase_anon_key').value = (await getSetting('supabase_anon_key')) || '';
}

async function save() {
  await setSetting('openai_api_key', document.getElementById('openai_api_key').value.trim());
  await setSetting('openai_base_url', document.getElementById('openai_base_url').value.trim());
  await setSetting('openai_model', document.getElementById('openai_model').value.trim());
  await setSetting('supabase_url', document.getElementById('supabase_url').value.trim());
  await setSetting('supabase_anon_key', document.getElementById('supabase_anon_key').value.trim());
  const el = document.getElementById('status');
  el.textContent = 'Saved';
  setTimeout(() => (el.textContent = ''), 1500);
}

document.getElementById('save').addEventListener('click', save);
document.getElementById('test').addEventListener('click', async () => {
  const el = document.getElementById('status');
  el.textContent = 'Testing...';
  const response = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'openai:models' }, resolve);
  });
  if (response?.error) {
    el.textContent = `Error: ${response.error}`;
  } else {
    el.textContent = `OK: ${response?.status}`;
  }
  setTimeout(() => (el.textContent = ''), 2500);
});
load();

