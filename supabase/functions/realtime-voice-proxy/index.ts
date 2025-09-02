import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts'

interface RealtimeRequest {
  action: 'connect' | 'send' | 'disconnect'
  sessionId?: string
  data?: any
  config?: {
    model?: string
    voice?: string
    instructions?: string
    language?: string
  }
}

// Store WebSocket connections in memory
const connections = new Map<string, WebSocket>()

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const body: RealtimeRequest = await req.json()
    const { action, sessionId, data, config } = body

    // Get OpenAI API key
    const openaiApiKey = await getOpenAIApiKey(authHeader)
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'connect':
        return handleConnect(openaiApiKey, config)
      
      case 'send':
        return handleSend(sessionId!, data)
      
      case 'disconnect':
        return handleDisconnect(sessionId!)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Realtime proxy error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getOpenAIApiKey(authHeader: string): Promise<string | null> {
  // First try environment variable
  let apiKey = Deno.env.get('OPENAI_API_KEY')
  if (apiKey) return apiKey

  // Then check database
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: authHeader } }
  })

  const { data: provider } = await supabase
    .from('admin_ai_providers')
    .select('configuration')
    .eq('provider_type', 'openai')
    .eq('is_active', true)
    .single()

  return provider?.configuration?.api_key || null
}

function handleConnect(apiKey: string, config?: any): Response {
  const sessionId = crypto.randomUUID()
  const model = config?.model || 'gpt-4o-realtime-preview-2024-12-06'
  
  // Create WebSocket connection to OpenAI
  const ws = new WebSocket(
    `wss://api.openai.com/v1/realtime?model=${model}`,
    ['realtime', `openai-insecure-api-key.${apiKey}`]
  )

  // Store connection
  connections.set(sessionId, ws)

  // Set up WebSocket handlers
  ws.onopen = () => {
    // Configure session
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: config?.instructions || "You are a helpful assistant.",
        voice: config?.voice || 'nova',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        }
      }
    }))
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
    connections.delete(sessionId)
  }

  ws.onclose = () => {
    connections.delete(sessionId)
  }

  return new Response(
    JSON.stringify({ sessionId, status: 'connected' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function handleSend(sessionId: string, data: any): Response {
  const ws = connections.get(sessionId)
  
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return new Response(
      JSON.stringify({ error: 'Session not found or disconnected' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  ws.send(JSON.stringify(data))
  
  return new Response(
    JSON.stringify({ status: 'sent' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function handleDisconnect(sessionId: string): Response {
  const ws = connections.get(sessionId)
  
  if (ws) {
    ws.close()
    connections.delete(sessionId)
  }
  
  return new Response(
    JSON.stringify({ status: 'disconnected' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}