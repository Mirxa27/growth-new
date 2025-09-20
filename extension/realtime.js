// Realtime voice session management for Chrome Extension MV3
// Traditional script approach - no ES modules

async function createVoiceSession(sessionId, metadata = {}) {
  await ensureSettingsLoaded();
  const supabaseUrl = await getSetting('supabase_url');
  const anonKey = await getSetting('supabase_anon_key');
  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase settings');
  }
  const tokenResp = await fetch(`${supabaseUrl}/functions/v1/get-realtime-token`);
  if (!tokenResp.ok) {
    throw new Error(`Token fetch failed: ${tokenResp.status}`);
  }
  const { token } = await tokenResp.json();

  const ws = new WebSocket(`wss://realtime.openai.com/v1?model=gpt-4o-realtime-preview-2024-12-17`, [
    'realtime',
    `openai-insecure-api-key.${token}`
  ]);

  const createPayload = {
    type: 'session.create',
    session: {
      type: 'voice',
      id: sessionId,
      metadata,
    },
  };

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify(createPayload));
  });

  return ws;
}

