// Background service worker as ES module (MV3)
import { ensureSettingsLoaded, getSetting, setSetting } from './utils.js';

chrome.runtime.onInstalled.addListener(() => {
  // Initialize defaults
  chrome.storage.sync.set({
    openai_base_url: 'https://api.openai.com',
    openai_model: 'gpt-4o-mini',
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      await ensureSettingsLoaded();
      if (message?.type === 'healthcheck') {
        sendResponse({ status: 'ok', model: await getSetting('openai_model') });
        return;
      }
      if (message?.type === 'openai:models') {
        const apiKey = await getSetting('openai_api_key');
        const baseUrl = (await getSetting('openai_base_url')) || 'https://api.openai.com';
        if (!apiKey) {
          sendResponse({ error: 'missing_api_key' });
          return;
        }
        const resp = await fetch(`${baseUrl}/v1/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const data = await resp.json();
        sendResponse({ status: resp.status, data });
        return;
      }
    } catch (error) {
      console.error('Background error', error);
      sendResponse({ error: String(error) });
    }
  })();
  return true;
});

