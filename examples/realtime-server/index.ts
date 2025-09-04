/**
 * examples/realtime-server/index.ts
 *
 * Minimal Node/Express example that demonstrates:
 * - verifying an incoming admin JWT (placeholder)
 * - calling the OpenAI Realtime client_secrets endpoint to mint an ephemeral client_secret
 * - returning a structured JSON success/error shape
 *
 * Usage:
 * 1. Install deps:
 *    npm init -y
 *    npm install express node-fetch@2
 *
 * 2. Set environment variables:
 *    OPENAI_API_KEY=sk-...
 *    ADMIN_TEST_TOKEN=your-admin-jwt-or-secret-for-test
 *
 * 3. Run:
 *    npx ts-node examples/realtime-server/index.ts
 *
 * This file is intentionally simple and suitable for local testing. Replace the
 * admin auth check with your proper auth (Supabase JWT verification or other).
 */
import express from 'express';
import fetch from 'node-fetch';

const PORT = Number(process.env.PORT || 4002);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ADMIN_TEST_TOKEN = process.env.ADMIN_TEST_TOKEN || 'dev-admin-token';

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not set. Set it in environment to continue.');
  process.exit(1);
}

const app = express();
app.use(express.json());

function verifyAdminAuth(req: express.Request): { ok: boolean; reason?: string } {
  // Replace with real JWT verification in production.
  const auth = req.header('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ')) return { ok: false, reason: 'missing_bearer' };
  const token = auth.slice(7).trim();
  if (!token) return { ok: false, reason: 'missing_token' };
  // In this example we accept ADMIN_TEST_TOKEN for dev.
  if (token === ADMIN_TEST_TOKEN) return { ok: true };
  return { ok: false, reason: 'invalid_admin_token' };
}

app.post('/get-realtime-token', async (req, res) => {
  try {
    const authCheck = verifyAdminAuth(req);
    if (!authCheck.ok) {
      return res.status(401).json({ error: 'Unauthorized', code: authCheck.reason });
    }

    const model = req.body?.model || 'gpt-4o-realtime-preview-2024-10-01';

    // Create ephemeral client secret at OpenAI
    const resp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model
        }
      })
    });

    if (!resp.ok) {
      let body = null;
      try { body = await resp.json(); } catch { body = await resp.text().catch(() => null); }
      console.error('Upstream OpenAI error creating ephemeral token', { status: resp.status, body });
      return res.status(502).json({
        error: 'Failed to create ephemeral token upstream',
        code: resp.status === 401 ? 'upstream_unauthorized' : 'ephemeral_creation_failed',
        upstreamStatus: resp.status,
        details: body
      });
    }

    const json = await resp.json();

    // Extract client_secret robustly
    const clientSecret =
      json?.client_secret?.value ??
      json?.client_secret?.secret ??
      (typeof json?.client_secret === 'string' ? json.client_secret : undefined) ??
      json?.clientSecret;

    const expiresAtRaw =
      json?.client_secret?.expires_at ??
      json?.client_secret?.expiry ??
      json?.expires_at ??
      null;

    if (!clientSecret) {
      console.error('No client_secret in upstream response', { scrubbed: { ...json, client_secret: '<REDACTED>' } });
      return res.status(502).json({ error: 'No client secret received from OpenAI', code: 'no_client_secret', upstream: '<REDACTED>' });
    }

    const expires_at = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : new Date(Date.now() + 3600_000).toISOString();

    // Return structured success shape (do not log secrets)
    return res.status(200).json({
      client_secret: clientSecret,
      model,
      expires_at,
      meta: {
        note: 'Ephemeral token created by example server'
      }
    });
  } catch (err: any) {
    console.error('Internal error in /get-realtime-token', err);
    return res.status(500).json({ error: err?.message || 'internal_error', code: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Example realtime server running on http://localhost:${PORT}`);
  console.log('POST /get-realtime-token with Authorization: Bearer <ADMIN_TEST_TOKEN>');
});