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
        const apiKey = await getSetting('openai_api_key');
        const baseUrl = (await getSetting('openai_base_url')) || 'https://api.openai.com';
        if (!apiKey) {
          sendResponse({ error: 'missing_api_key' });
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

