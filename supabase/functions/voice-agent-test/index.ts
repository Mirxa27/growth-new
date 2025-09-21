import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VoiceTestRequest {
  configId: string
  testMessage?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { configId, testMessage = "Hello, this is a test of the voice agent configuration." }: VoiceTestRequest = await req.json()

    if (!configId) {
      return new Response(
        JSON.stringify({ error: 'Configuration ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the voice agent configuration
    const { data: config, error: configError } = await supabase
      .from('voice_agent_configs')
      .select('*')
      .eq('id', configId)
      .single()

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'Voice configuration not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get OpenAI API key from config or environment
    const openaiApiKey = config.openai_api_key || Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Test OpenAI connection with a simple chat completion
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
        ...(config.openai_organization && { 'OpenAI-Organization': config.openai_organization }),
        ...(config.openai_project && { 'OpenAI-Project': config.openai_project }),
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: config.instructions || 'You are a helpful AI assistant for personal development and wellness.'
          },
          {
            role: 'user',
            content: testMessage
          }
        ],
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 150,
      }),
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('OpenAI API error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API test failed: ${testResponse.status} ${testResponse.statusText}`,
          details: errorText
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const responseData = await testResponse.json()
    const aiResponse = responseData.choices[0]?.message?.content

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: 'No response generated from AI model' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Test TTS if voice is configured
    let ttsTest = null
    if (config.voice && config.voice !== 'none') {
      try {
        const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
            ...(config.openai_organization && { 'OpenAI-Organization': config.openai_organization }),
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: config.voice,
            input: 'This is a test of text-to-speech.',
          }),
        })

        ttsTest = {
          success: ttsResponse.ok,
          status: ttsResponse.status,
          message: ttsResponse.ok ? 'TTS test successful' : `TTS test failed: ${ttsResponse.statusText}`
        }
      } catch (ttsError) {
        ttsTest = {
          success: false,
          message: `TTS test error: ${ttsError.message}`
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Voice agent configuration test successful',
        testResponse: aiResponse,
        config: {
          model: config.model,
          voice: config.voice,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
        },
        ttsTest,
        usage: responseData.usage
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Voice agent test error:', error)
    return new Response(
      JSON.stringify({ error: `Voice agent test failed: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})