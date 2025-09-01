// supabase/functions/test-ai-provider/index.ts
// -------------------------------------------------
// CORS-enabled Edge Function for AI Provider Testing
// -------------------------------------------------

const ALLOWED_ORIGIN = "*" // Change to your Vercel domain for production
const ALLOWED_METHODS = "POST, GET, OPTIONS"
const ALLOWED_HEADERS = "content-type, authorization, x-application-version, x-application-name"
const MAX_AGE = "86400" // 24 h cache for pre-flight

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": MAX_AGE,
  }
}

Deno.serve(async (req: Request) => {
  // ---------- 1️⃣ OPTIONS pre-flight ----------
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  // ---------- 2️⃣ Normal request ----------
  try {
    const payload = req.method === "POST" ? await req.json() : {}
    
    // Test AI provider configuration
    const { provider, apiKey, model } = payload

    // Validate required fields
    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: provider and apiKey" 
        }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      )
    }

    // Test based on provider
    let testResult = { success: false, message: "", details: {} }

    if (provider === "openai") {
      try {
        // Test OpenAI API
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          testResult = {
            success: true,
            message: "OpenAI API key is valid",
            details: {
              modelsAvailable: data.data?.length || 0,
              hasGPT4: data.data?.some((m: any) => m.id.includes("gpt-4")),
              hasRealtime: data.data?.some((m: any) => m.id.includes("realtime")),
            },
          }
        } else {
          const error = await response.json()
          testResult = {
            success: false,
            message: error.error?.message || "Invalid API key",
            details: { status: response.status },
          }
        }
      } catch (error) {
        testResult = {
          success: false,
          message: `Failed to connect to OpenAI: ${error.message}`,
          details: {},
        }
      }
    } else if (provider === "anthropic") {
      // Test Anthropic API
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: model || "claude-3-haiku-20240307",
            max_tokens: 10,
            messages: [{ role: "user", content: "Hi" }],
          }),
        })

        if (response.ok) {
          testResult = {
            success: true,
            message: "Anthropic API key is valid",
            details: { model: model || "claude-3-haiku-20240307" },
          }
        } else {
          const error = await response.json()
          testResult = {
            success: false,
            message: error.error?.message || "Invalid API key",
            details: { status: response.status },
          }
        }
      } catch (error) {
        testResult = {
          success: false,
          message: `Failed to connect to Anthropic: ${error.message}`,
          details: {},
        }
      }
    } else {
      testResult = {
        success: false,
        message: `Unsupported provider: ${provider}`,
        details: {},
      }
    }

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    })
  } catch (e) {
    console.error(e)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Internal server error",
        message: e.message 
      }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    )
  }
})