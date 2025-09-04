/* eslint-disable @typescript-eslint/no-explicit-any */
// The function is a Deno edge function. Provide minimal declarations so the VSCode TypeScript
// environment does not complain while keeping runtime compatibility with Deno.
declare const Deno: any
// Allow the esm.sh import; at runtime Deno will fetch it. Suppress editor module-not-found errors.
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
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
      console.error('get-realtime-token: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing')
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
      console.warn('get-realtime-token: user verification failed', { userError: userError?.message })
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
        console.error('get-realtime-token: failed to fetch profile for RBAC check', { profileError: profileError.message })
        return new Response(
          JSON.stringify({ error: 'Failed RBAC check', code: 'rbac_failure' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const isAdmin = !!(profile?.is_admin || profile?.is_admin_backup)
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: admin-only', code: 'forbidden' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (e) {
      console.error('get-realtime-token: unexpected error during RBAC check', e)
      return new Response(
        JSON.stringify({ error: 'RBAC check error', code: 'rbac_error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
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
      console.error('get-realtime-token: missing OpenAI API key (env/db)')
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
    let model = 'gpt-4o-realtime-preview-2024-10-01'
    let voice = 'alloy'
    let systemPrompt = "You are NewMe, a supportive growth guide for women's personal growth. Be warm, encouraging, and insightful."
    let temperature = 0.7
    let maxTokens = 1000

    try {
      const { data: cfg, error: cfgErr } = await serviceClient
        .from('voice_agent_configs')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cfgErr) {
        console.warn('get-realtime-token: could not fetch voice agent config', cfgErr.message)
      } else if (cfg) {
        model = cfg.model || model
        voice = cfg.voice_id || voice
        systemPrompt = cfg.system_prompt || systemPrompt
        temperature = cfg.temperature ?? temperature
        maxTokens = cfg.max_tokens ?? maxTokens
      }
    } catch (err) {
      console.warn('get-realtime-token: could not fetch voice agent config, using defaults.', err?.message || err)
    }

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
      console.error('get-realtime-token: failed to create ephemeral token upstream', { upstreamStatus, upstreamBody })
 
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
      console.error('get-realtime-token: failed to parse ephemeral response JSON', e)
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
      console.error('get-realtime-token: OpenAI returned no client_secret', { scrubbed })
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
        console.warn('get-realtime-token: failed to log voice session', logError.message)
      }
    } catch (e) {
      console.warn('get-realtime-token: exception when logging voice session', e?.message || e)
    }

    // Return the client secret and model details to the client (structured)
    return new Response(
      JSON.stringify({
        client_secret: clientSecret,
        model,
        expires_at: expiresAt,
        meta: {
          voice,
          temperature,
          max_tokens: maxTokens
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in get-realtime-token:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error', code: 'internal_error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
