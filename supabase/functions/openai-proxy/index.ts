/**
 * OpenAI Proxy Edge Function
 * Securely proxies OpenAI API requests without exposing the API key to the client
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.1';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-version, x-application-name, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured on server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { endpoint, method = 'POST', body } = await req.json();

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate endpoint (whitelist allowed OpenAI endpoints)
    const allowedEndpoints = [
      '/v1/chat/completions',
      '/v1/completions',
      '/v1/models',
      '/v1/embeddings',
      '/v1/audio/transcriptions',
      '/v1/audio/translations',
      '/v1/images/generations',
      '/v1/moderations'
    ];

    const isAllowed = allowedEndpoints.some(allowed => endpoint.startsWith(allowed));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: 'Endpoint not allowed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Make request to OpenAI
    const openaiUrl = `https://api.openai.com${endpoint}`;
    const openaiHeaders: HeadersInit = {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    };

    // Add organization ID if provided
    const orgId = Deno.env.get('OPENAI_ORG_ID');
    if (orgId) {
      openaiHeaders['OpenAI-Organization'] = orgId;
    }

    const openaiResponse = await fetch(openaiUrl, {
      method,
      headers: openaiHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get response data
    const responseData = await openaiResponse.json().catch(() => null);

    // Log usage for monitoring (optional)
    if (responseData?.usage) {
      console.log('OpenAI usage:', {
        userId: user.id,
        endpoint,
        tokens: responseData.usage.total_tokens,
        model: body?.model || 'unknown',
      });
    }

    // Return response
    return new Response(
      JSON.stringify(responseData || { error: 'Invalid response from OpenAI' }),
      {
        status: openaiResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('OpenAI proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});