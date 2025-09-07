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
  let responded = false;
  const safeSend = (payload) => {
    if (responded) return;
    try {
      sendResponse(payload);
      responded = true;
    } catch (e) {
      // Ignore if port is closed or sender tab/frame no longer exists
      console.debug('Response could not be sent:', e?.message || e);
    }
  };

  (async () => {
    try {
      await ensureSettingsLoaded();
      if (message?.type === 'healthcheck') {
        safeSend({ status: 'ok', model: await getSetting('openai_model') });
        return;
      }
      if (message?.type === 'openai:models') {
        const apiKey = await getSetting('openai_api_key');
        const baseUrl = (await getSetting('openai_base_url')) || 'https://api.openai.com';
        if (!apiKey) {
          safeSend({ error: 'missing_api_key' });
          return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const resp = await fetch(`${baseUrl}/v1/models`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            signal: controller.signal,
          });
          const data = await resp.json();
          safeSend({ status: resp.status, data });
        } finally {
          clearTimeout(timeout);
        }
        return;
      }
    } catch (error) {
      console.error('Background error', error);
      safeSend({ error: String(error) });
    }
  })();
  return true;
});

