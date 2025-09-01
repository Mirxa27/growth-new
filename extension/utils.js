export async function ensureSettingsLoaded() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ['openai_api_key', 'openai_base_url', 'openai_model'],
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

