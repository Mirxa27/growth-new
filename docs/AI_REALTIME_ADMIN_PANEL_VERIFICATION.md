# GPT‑Realtime Voice Agent Admin Panel — Verification & Security Checklist

This document explains what I changed, how those changes fix the original CORS / NetworkError / notification issues, exact commands to run locally (including Edge functions), plus step-by-step verification scenarios and a security/privacy checklist.

Files changed (high level)
- [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts:12) — stopped sending custom global headers from the browser; only include `x-application-name` / `x-application-version` on server/service clients.
- [`supabase/functions/_shared/cors.ts`](supabase/functions/_shared/cors.ts:1) — shared CORS header helper (kept and reused).
- [`supabase/functions/test-ai-provider/index.ts`](supabase/functions/test-ai-provider/index.ts:1) — hardened CORS handling, server-side validation, rejects browser-sent API keys, enforces admin auth check, returns explicit CORS headers.
- [`supabase/functions/get-realtime-token/index.ts`](supabase/functions/get-realtime-token/index.ts:1) — issues ephemeral realtime tokens, enforces admin-only RBAC (verifies profile `is_admin_backup`), reads API keys server-side, does not return secrets except the ephemeral client secret.
- [`src/components/admin/AIRealtimeVoiceAgentAdminPanel.tsx`](src/components/admin/AIRealtimeVoiceAgentAdminPanel.tsx:1) — new admin-only React + TypeScript panel that replaces the older `AIProviderSettings` UI; includes Provider, Voice, Runtime, Persona controls, Test Connection, token minting, WebSocket + WebRTC attempt with fallback, audio preview, logs.
- [`src/pages/AdminDashboard.tsx`](src/pages/AdminDashboard.tsx:34) — replaced import of `AIProviderSettings` with the new panel.
- [`src/services/error/error-handler.service.ts`](src/services/error/error-handler.service.ts:1) — improved error-logging with retry/backoff, emits admin-facing events when logging fails, uses centralized `logger`.
- [`src/services/notification/notification.service.ts`](src/services/notification/notification.service.ts:1) — more robust error handling, uses `errorHandler` instead of console.* and seeds defaults safely.

Why these changes fix the observed errors
- CORS preflight / NetworkError caused by browser-sent custom headers:
  - Previously the browser Supabase client included `x-application-name` / `x-application-version` globally. Browsers send an OPTIONS preflight which fails if the remote endpoint does not explicitly allow those headers. By changing [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts:12) so the browser client omits global headers, preflights no longer include custom headers and the NetworkError is resolved.
- Edge function CORS and test provider issues:
  - [`supabase/functions/test-ai-provider/index.ts`](supabase/functions/test-ai-provider/index.ts:1) now explicitly handles OPTIONS and returns the configured CORS headers (from [`supabase/functions/_shared/cors.ts`](supabase/functions/_shared/cors.ts:1)). It also rejects any attempt to submit API keys from the browser and validates provider configuration server-side, which prevents secrets from being sent through the client.
- Notification / Error logging failures:
  - The error logger now has retry/backoff and emits structured events the admin UI can listen for. The `notification.service` uses `errorHandler` for failures so network/database errors are retried and surfaced in a controlled manner. This avoids unhandled TypeError network exceptions bubbling to the console.

Commands to run & test locally

Prerequisites
- Node 18+ and npm (or pnpm)
- Deno (to run Supabase functions locally using the Deno runtime)
- Supabase CLI (optional but recommended) OR run Deno directly for functions
- Ensure environment variables are set (see Security Checklist below)

Run the frontend locally
1. Install deps:
   - npm install
2. Start dev server:
   - npm run dev
   This launches the Vite dev server and you can open the app at http://localhost:5173 (or the displayed port).

Run serverless functions locally with Deno
1. Using Deno directly (simple):
   - Deno run --allow-net --allow-env --allow-read supabase/functions/test-ai-provider/index.ts
   - Deno run --allow-net --allow-env --allow-read supabase/functions/get-realtime-token/index.ts
2. Using Supabase CLI (if you have it):
   - supabase functions serve test-ai-provider
   - supabase functions serve get-realtime-token

Note: When running functions locally, ensure the following env vars are exported in your shell:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY (server-side only)

Quick verification checklist (end-to-end)
A. Confirm CORS / NetworkError is resolved
1. Start the frontend (npm run dev) and local functions (Deno or supabase functions serve).
2. Open browser DevTools console and network tab.
3. In Admin → Providers (now the new panel), click "Test Connection".
   - Expected: 200 response from [`/functions/v1/test-ai-provider`] and no CORS preflight failure for `x-application-name`.
   - The panel logs should show "test-ai-provider result: ..." and the toast shows success or a server-side validation message.
4. Trigger operations that previously failed (notification preference fetch, error logging).
   - Expected: requests succeed or graceful fallback occurs. No "TypeError: NetworkError when attempting to fetch resource." in the console.

B. Verify admin-only access and token issuance
1. Sign-in as a non-admin user and open Admin → Providers.
   - Expected: "Admin Access Required" message in the panel.
2. Sign-in as an admin (profile row `is_admin_backup` true) and open the panel.
   - Click "Start Live Session".
   - Expected: client calls `get-realtime-token` and receives a short-lived ephemeral secret (no server-stored API keys are returned). The function must respond 200 and CORS preflight must succeed.
   - If using WebSocket transport: the panel will attempt to open a WebSocket to OpenAI Realtime with the ephemeral secret; you should see connection logs.
   - If WebRTC is selected and the endpoint/SOP supports SDP exchange, WebRTC path will be attempted first, otherwise fallback to WebSocket.

C. Verify notification and error-logging fixes
1. Cause a recoverable network error (e.g., temporarily block network or mock a failing request).
2. Confirm that errors are queued and retried, and that the admin panel receives a `window` event `error-logging-failed` if persistence fails. The panel's logs should show structured error events.

D. Reproduce original failures (to compare before/after)
1. Checkout the commit before this change (if available) or reintroduce the global headers in [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts:12) to simulate prior behavior.
2. Trigger Test Connection — you should see the CORS preflight rejection and the NetworkError in console.
3. Revert to current branch to see the fix.

Unit / Integration / E2E test guidance (commands & structure)
- Project test runner: vitest (project standard). If not installed: npm i -D vitest @testing-library/react
- Suggested tests to add:
  - Unit: utils that parse ICE server JSON, base64 audio decode helper.
  - Integration: serverless function `test-ai-provider` responds to OPTIONS with correct CORS headers and returns 200 for valid server-side provider configs (use a mocked Supabase client or run functions locally with test env vars).
  - E2E: Script (playwright or Cypress) to automate:
    1. Launch dev server
    2. Login as admin
    3. Open Admin Dashboard and navigate to Providers
    4. Click Test Connection; assert no CORS errors and success UI state
    5. Start Live Session and send a preview prompt; assert audio element plays (or audio blob present)
- Example local test command:
  - npm run test:unit
  - npm run test:integration
  - npm run test:e2e

Security & Privacy checklist (explicit)
- API keys:
  - Server-side only: `OPENAI_API_KEY` and other provider secrets live only on server (Env or secure DB `admin_ai_providers.configuration`).
  - Client does NOT send or store long-lived API keys. If a client attempts to send `configuration.api_key`, the server `test-ai-provider` rejects the request.
- Ephemeral tokens:
  - `get-realtime-token` returns a short-lived ephemeral client secret (issued by OpenAI). Tokens expire quickly (OpenAI ephemeral expiry or our default 1 hour).
  - Tokens are recorded server-side without storing secrets; logs use placeholders like `realtime_session_placeholder`.
- RBAC:
  - `get-realtime-token` and `test-ai-provider` verify the caller is authenticated and has an admin flag (`profiles.is_admin_backup`) before issuing tokens or validating provider configs.
- Logging:
  - Secrets redacted in logs. Server and client logging never include API keys or token values except ephemeral client secret returned to the browser (which is intended).
- Least privilege:
  - Service-role client is used only on server/Edge functions; browser uses anon client with no custom headers.
- Transport security:
  - WebRTC preferred (secure SRTP), fallback to WebSocket/SSE if needed. All connections use ephemeral credentials.

Files to review for details
- Admin UI: [`src/components/admin/AIRealtimeVoiceAgentAdminPanel.tsx`](src/components/admin/AIRealtimeVoiceAgentAdminPanel.tsx:1)
- Supabase client: [`src/integrations/supabase/client.ts`](src/integrations/supabase/client.ts:1)
- Edge functions:
  - [`supabase/functions/test-ai-provider/index.ts`](supabase/functions/test-ai-provider/index.ts:1)
  - [`supabase/functions/get-realtime-token/index.ts`](supabase/functions/get-realtime-token/index.ts:1)
  - Shared CORS: [`supabase/functions/_shared/cors.ts`](supabase/functions/_shared/cors.ts:1)
- Services:
  - [`src/services/error/error-handler.service.ts`](src/services/error/error-handler.service.ts:1)
  - [`src/services/notification/notification.service.ts`](src/services/notification/notification.service.ts:1)
- Admin dashboard wiring: [`src/pages/AdminDashboard.tsx`](src/pages/AdminDashboard.tsx:34)

Next steps I will implement (if you want me to continue)
- Add unit & integration tests (vitest) for the serverless CORS and token endpoints.
- Add a small e2e test (playwright) or an E2E verification script using Puppeteer to exercise the admin flow end-to-end.
- Harden further RBAC by adding an `admin_users` guard table if you prefer not to rely on `is_admin_backup` profile flag.
- Add server-side audit logs that redact secrets.

If you want me to continue now I will:
- Create the test files (unit + integration + e2e)
- Wire up CI commands in package.json (scripts)
- Run the test suite locally and report results (I will produce instructions for running them)

If you want to review current changes before I continue, say “Stop — show diffs & summary” and I’ll pause and present file diffs for all modified files.
