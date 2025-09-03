import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { providerId, provider, config } = await req.json()

    // Build a supabase client with service role to read admin_ai_providers
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Resolve provider and key
    let providerType = provider as string | undefined
    let apiKey = config?.api_key as string | undefined

    if (providerId) {
      const { data } = await supabase
        .from('admin_ai_providers')
        .select('provider_type, configuration')
        .eq('id', providerId)
        .maybeSingle()
      if (data) {
        providerType = data.provider_type
        apiKey = (data.configuration as any)?.api_key || apiKey
      }
    }

    if (!providerType) {
      return new Response(
        JSON.stringify({ success: false, message: 'Provider type is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let result = { success: false, message: '' }

    switch (providerType) {
      case 'openai': {
        if (!apiKey) {
          result = { success: false, message: 'OpenAI API key is required' }
        } else {
          const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          })
          result = response.ok
            ? { success: true, message: 'OpenAI connection successful' }
            : { success: false, message: `OpenAI API error: ${response.status}` }
        }
        break
      }
      case 'anthropic': {
        result = apiKey
          ? { success: true, message: 'Anthropic configuration valid' }
          : { success: false, message: 'Anthropic API key is required' }
        break
      }
      case 'google': {
        result = apiKey
          ? { success: true, message: 'Google AI configuration valid' }
          : { success: false, message: 'Google AI API key is required' }
        break
      }
      default: {
        result = { success: false, message: 'Unknown provider' }
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

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