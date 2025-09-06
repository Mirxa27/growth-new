/* eslint-disable @typescript-eslint/no-explicit-any */
// The function is a Deno edge function. Provide minimal declarations so the VSCode TypeScript
// environment does not complain while keeping runtime compatibility with Deno.
declare const Deno: any
// Allow the esm.sh import; at runtime Deno will fetch it. Suppress editor module-not-found errors.
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts';
import { logger } from '../_shared/logger.ts';
import { metrics } from '../_shared/metrics.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now();
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      logger.warn('No authorization header', { path: '/get-realtime-token' });
      return new Response(
        JSON.stringify({ error: 'No authorization header', code: 'no_auth' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Malformed authorization header', code: 'malformed_auth' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Required env
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing', { path: '/get-realtime-token' });
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration', code: 'server_config' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create two Supabase clients:
    // - userClient: uses the incoming Authorization header to validate the user token
    // - serviceClient: uses the service role key for privileged DB reads/writes (RBAC checks, logging)
    // Prefer using the public ANON key for the userClient when available. Only fall back to the
    // service role key if the anon key is not configured (we warn when falling back).
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const userClientKey = anonKey || supabaseServiceKey
    if (!anonKey) {
      console.warn('get-realtime-token: SUPABASE_ANON_KEY not set; using service role key for user validation (less ideal)')
    }
    const userClient = createClient(supabaseUrl, userClientKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user is authenticated via userClient
    const { data: userData, error: userError } = await userClient.auth.getUser()
    const user = userData?.user
    if (userError || !user) {
      logger.warn('User verification failed', { path: '/get-realtime-token', error: userError?.message });
      return new Response(
        JSON.stringify({ error: 'Unauthorized', code: 'unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // RBAC: ensure the user is an admin (either is_admin or is_admin_backup)
    try {
      const { data: profile, error: profileError } = await serviceClient
        .from('profiles')
        .select('is_admin, is_admin_backup')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        // Do not fail hard if profiles table/columns are missing; proceed without admin gating
        logger.warn('RBAC profile check skipped (profiles unavailable)', { path: '/get-realtime-token', error: profileError.message })
      } else {
        const isAdmin = !!(profile?.is_admin || profile?.is_admin_backup)
        // RBAC is relaxed in this function to allow authenticated users in dev.
        // If needed, uncomment to enforce admin-only access.
        // if (!isAdmin) {
        //   logger.warn('Non-admin user attempted to get realtime token', { path: '/get-realtime-token', userId: user.id });
        //   return new Response(
        //     JSON.stringify({ error: 'Forbidden: admin-only', code: 'forbidden' }),
        //     {
        //       status: 403,
        //       headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        //     }
        //   )
        // }
      }
    } catch (e) {
      // Non-fatal RBAC issues; continue to allow dev/testing
      logger.warn('RBAC check error; proceeding in relaxed mode', { path: '/get-realtime-token', error: e })
    }

    // Get the OpenAI API key from environment variables or the database (serviceClient)
    let openaiApiKey = Deno.env.get('OPENAI_API_KEY') || ''

    if (!openaiApiKey) {
      try {
        const { data: provider, error: providerError } = await serviceClient
          .from('admin_ai_providers')
          .select('configuration')
          .eq('provider_type', 'openai')
          .eq('is_active', true)
          .maybeSingle()

        if (providerError) {
          console.error('get-realtime-token: failed to read admin_ai_providers', providerError.message)
        } else if (provider?.configuration?.api_key) {
          openaiApiKey = provider.configuration.api_key
        }
      } catch (e) {
        console.warn('get-realtime-token: error reading provider config', e?.message || e)
      }
    }

    if (!openaiApiKey) {
      logger.error('Missing OpenAI API key', { path: '/get-realtime-token' });
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key not configured. Please add your API key in the admin settings.',
          code: 'no_openai_key'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch active voice agent configuration with full details (serviceClient)
    let model = 'gpt-realtime-2025-08-28' // Standardized realtime model
    let voice = 'alloy'
    let systemPrompt = "You are NewMe, a supportive growth guide for women's personal growth. Be warm, encouraging, and insightful."
    let temperature = 0.7
    let maxTokens = 1000

    try {
      const { data: cfg, error: cfgErr } = await serviceClient
        .from('voice_agent_configs')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (cfgErr) {
        console.warn('get-realtime-token: could not fetch voice agent config', cfgErr.message)
      } else if (cfg) {
        model = (cfg as any).model || model
        // Support both voice_id (legacy) and voice (current)
        voice = (cfg as any).voice || (cfg as any).voice_id || voice
        // Support both system_prompt (legacy) and instructions (current)
        systemPrompt = (cfg as any).system_prompt || (cfg as any).instructions || systemPrompt
        temperature = (cfg as any).temperature ?? temperature
        if (typeof (cfg as any).max_tokens === 'number') {
          maxTokens = (cfg as any).max_tokens
        }
      }
    } catch (err) {
      console.warn('get-realtime-token: could not fetch voice agent config, using defaults.', err?.message || err)
    }

    // Load user memory highlights for personalization
    let memoryHighlights: { preferences: string[]; themes: string[]; context: string[] } | null = null
    try {
      const { data: mem } = await serviceClient
        .from('user_memory_highlights')
        .select('highlights')
        .eq('user_id', user.id)
        .maybeSingle()
      memoryHighlights = mem?.highlights || { preferences: [], themes: [], context: [] }
    } catch (_) {
      memoryHighlights = { preferences: [], themes: [], context: [] }
    }

    // Craft enriched instructions including compact memory
    const memoryParts: string[] = []
    if (memoryHighlights?.preferences?.length) memoryParts.push(`Preferences: ${memoryHighlights.preferences.join('; ')}`)
    if (memoryHighlights?.themes?.length) memoryParts.push(`Recurring themes: ${memoryHighlights.themes.join('; ')}`)
    if (memoryHighlights?.context?.length) memoryParts.push(`Context: ${memoryHighlights.context.join('; ')}`)
    const memoryText = memoryParts.length ? `\n\nPersonalization memory (use implicitly, do not restate):\n${memoryParts.join('\n')}` : ''
    const enrichedInstructions = `${systemPrompt}${memoryText}`

    // Create an ephemeral client secret via OpenAI for the browser to use with Realtime API.
    // Use a small retry/backoff loop for transient upstream errors (429/5xx). Return
    // clear structured errors while scrubbing any secret material from logs.
    async function createEphemeralClientSecret(apiKey: string, modelName: string) {
      const maxAttempts = 3
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const resp = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session: {
                type: 'realtime',
                model: modelName,
              }
            })
          })
 
          if (resp.ok) {
            return { ok: true, resp }
          }
 
          // Non-OK status from upstream
          const status = resp.status
          let body: any = null
          try {
            body = await resp.clone().json().catch(() => null)
          } catch {
            // fallback to text if json parsing fails
            body = await resp.clone().text().catch(() => null)
          }
 
          // Retry on rate-limit or server errors
          if (status === 429 || (status >= 500 && status < 600)) {
            const retryAfter = resp.headers.get('retry-after')
            const backoffMs = retryAfter ? Number(retryAfter) * 1000 : Math.pow(2, attempt) * 150
            await new Promise((r) => setTimeout(r, backoffMs))
            continue
          }
 
          return { ok: false, status, body }
        } catch (err) {
          // Network or runtime error - retry a few times
          if (attempt === maxAttempts) {
            return { ok: false, error: err }
          }
          const backoffMs = Math.pow(2, attempt) * 150
          await new Promise((r) => setTimeout(r, backoffMs))
        }
      }
      return { ok: false, error: 'max_retries_exceeded' }
    }
 
    const ephemResult: any = await createEphemeralClientSecret(openaiApiKey, model)
 
    if (!ephemResult.ok) {
      // Avoid logging secrets. Provide the upstream status/body (scrubbed) for debugging.
      const upstreamStatus = ephemResult.status ?? null
      const upstreamBody = ephemResult.body ?? (ephemResult.error ? String(ephemResult.error) : null)
      logger.error('Failed to create ephemeral token upstream', { path: '/get-realtime-token', upstreamStatus, upstreamBody });
  
      const upstreamCode = upstreamStatus === 401 ? 'upstream_unauthorized' : 'ephemeral_creation_failed'
      return new Response(
        JSON.stringify({
          error: 'Failed to create ephemeral token upstream',
          code: upstreamCode,
          upstreamStatus,
          details: upstreamBody
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
 
    // Parse ephemeral response safely
    let ephem: any = null
    try {
      if (!ephemResult || !ephemResult.resp) {
        throw new Error('missing upstream response')
      }
      ephem = await ephemResult.resp.json()
    } catch (e) {
      logger.error('Failed to parse ephemeral response JSON', { path: '/get-realtime-token', error: e });
      return new Response(
        JSON.stringify({ error: 'Upstream returned invalid JSON', code: 'upstream_invalid_json' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
 
    // Extract client secret robustly from known possible shapes while avoiding logging secrets.
    const clientSecret =
      ephem?.client_secret?.value ??
      ephem?.client_secret?.secret ??
      (typeof ephem?.client_secret === 'string' ? ephem.client_secret : undefined) ??
      ephem?.clientSecret
 
    const expiresAtRaw =
      ephem?.client_secret?.expires_at ??
      ephem?.client_secret?.expiry ??
      ephem?.expires_at ??
      null
 
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString()
 
    if (!clientSecret) {
      // Scrub any client_secret before logging: replace with marker.
      const scrubbed = JSON.parse(JSON.stringify(ephem || {}))
      if (scrubbed?.client_secret) {
        scrubbed.client_secret = '<REDACTED>'
      }
      logger.error('OpenAI returned no client_secret', { path: '/get-realtime-token', scrubbed });
      return new Response(
        JSON.stringify({ error: 'No client secret received from OpenAI', code: 'no_client_secret', upstream: scrubbed ?? null }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log the session creation using serviceClient (avoid storing secrets)
    try {
      const { error: logError } = await serviceClient
        .from('voice_sessions')
        .insert({
          user_id: user.id,
          session_token: 'realtime_session', // Placeholder; do NOT store client_secret
          status: 'active',
          metadata: {
            model,
            voice,
            created_at: new Date().toISOString(),
            expires_at: expiresAt
          }
        })

      if (logError) {
        logger.warn('Failed to log voice session', { path: '/get-realtime-token', error: logError.message });
      }
    } catch (e) {
      logger.warn('Exception when logging voice session', { path: '/get-realtime-token', error: e?.message || e });
    }

    // Return the client secret and model details to the client (structured)
    metrics.timing('get-realtime-token.duration', Date.now() - startTime);
    metrics.increment('get-realtime-token.success');
    return new Response(
      JSON.stringify({
        client_secret: clientSecret,
        model,
        expires_at: expiresAt,
        meta: {
          voice,
          temperature,
          max_tokens: maxTokens,
          memory: memoryHighlights,
          instructions: enrichedInstructions
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    logger.error('Error in get-realtime-token', { path: '/get-realtime-token', error });
    metrics.increment('get-realtime-token.error');
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error', code: 'internal_error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
