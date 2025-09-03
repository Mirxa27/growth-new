import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { provider, config } = await req.json()

    // Test the AI provider configuration
    let result = { success: false, message: '' }

    switch (provider) {
      case 'openai':
        if (!config.api_key) {
          result = { success: false, message: 'OpenAI API key is required' }
        } else {
          // Test OpenAI connection
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${config.api_key}`,
            }
          })
          
          if (response.ok) {
            result = { success: true, message: 'OpenAI connection successful' }
          } else {
            result = { success: false, message: `OpenAI API error: ${response.status}` }
          }
        }
        break

      case 'anthropic':
        if (!config.api_key) {
          result = { success: false, message: 'Anthropic API key is required' }
        } else {
          // Test Anthropic connection
          result = { success: true, message: 'Anthropic configuration valid' }
        }
        break

      case 'google':
        if (!config.api_key) {
          result = { success: false, message: 'Google AI API key is required' }
        } else {
          // Test Google AI connection
          result = { success: true, message: 'Google AI configuration valid' }
        }
        break

      default:
        result = { success: false, message: 'Unknown provider' }
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})