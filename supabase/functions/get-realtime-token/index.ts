// supabase/functions/get-realtime-token/index.ts
// -------------------------------------------------
// CORS-enabled Edge Function for Realtime Token Generation
// -------------------------------------------------

const ALLOWED_ORIGIN = "*" // Change to your domain for production
const ALLOWED_METHODS = "POST, GET, OPTIONS"
const ALLOWED_HEADERS = "content-type, authorization, x-application-version, x-application-name"
const MAX_AGE = "86400"

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": MAX_AGE,
  }
}

Deno.serve(async (req: Request) => {
  // ---------- OPTIONS pre-flight ----------
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  // ---------- Normal request ----------
  try {
    // Get OpenAI API key from environment
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
    
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      )
    }

    // Generate ephemeral token for OpenAI Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-10-01",
        voice: "alloy",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return new Response(
        JSON.stringify({ 
          error: "Failed to generate token",
          details: error 
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      )
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({
        client_secret: data.client_secret,
        expires_at: data.expires_at,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    )
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({ error: "Internal server error", message: e.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    )
  }
})