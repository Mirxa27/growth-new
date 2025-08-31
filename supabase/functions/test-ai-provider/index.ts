/// <reference types="https://esm.sh/v135/@deno/types@0.1.43/index.d.ts" />
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestConfig {
  providerId: string;
}

async function testOpenAIProvider(apiKey: string, endpoint?: string): Promise<any> {
  const baseUrl = endpoint || 'https://api.openai.com/v1';
  
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant being tested.' },
        { role: 'user', content: 'Hello! Please respond with "Test successful" if you can hear me.' }
      ],
      max_tokens: 50,
      temperature: 0.1
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    success: true,
    response: data.choices[0]?.message?.content || 'No response',
    latency: response.headers.get('x-request-id') ? 'Available' : 'N/A',
    model_used: 'gpt-4o-mini',
    usage: data.usage
  };
}

async function testElevenLabsProvider(apiKey: string): Promise<any> {
  // Test with a simple TTS request
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'Test successful',
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  return {
    success: true,
    response: 'Audio generated successfully',
    latency: 'Available',
    model_used: 'eleven_monolingual_v1',
    voice_used: 'Rachel (21m00Tcm4TlvDq8ikWAM)'
  };
}

async function testAnthropicProvider(apiKey: string): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
      messages: [
        { role: 'user', content: 'Please respond with "Test successful" if you can hear me.' }
      ]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return {
    success: true,
    response: data.content[0]?.text || 'No response',
    latency: 'Available',
    model_used: 'claude-3-haiku-20240307',
    usage: data.usage
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { providerId }: TestConfig = await req.json();
    
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get provider details
    const { data: provider, error } = await supabaseClient
      .from('admin_ai_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error || !provider) {
      throw new Error('Provider not found');
    }

    // Use the OpenAI API key from Supabase secrets for OpenAI providers
    let apiKey = provider.api_key;
    if (provider.provider_type === 'openai' && !apiKey) {
      apiKey = Deno.env.get('OPENAI_API_KEY');
    }

    if (!apiKey) {
      throw new Error('API key not configured for this provider');
    }

    console.log(`Testing provider: ${provider.name} (${provider.provider_type})`);

    let result;
    const startTime = Date.now();

    switch (provider.provider_type?.toLowerCase()) {
      case 'openai':
        result = await testOpenAIProvider(apiKey, provider.configuration?.endpoint_url);
        break;
      
      case 'elevenlabs':
        result = await testElevenLabsProvider(apiKey);
        break;
      
      case 'anthropic':
        result = await testAnthropicProvider(apiKey);
        break;
      
      default:
        throw new Error(`Unsupported provider type: ${provider.provider_type}`);
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Update provider test results
    await supabaseClient
      .from('admin_ai_providers')
      .update({
        configuration: {
          ...provider.configuration,
          last_test: new Date().toISOString(),
          last_test_success: result.success,
          last_response_time: responseTime
        }
      })
      .eq('id', providerId);

    return new Response(
      JSON.stringify({
        test_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        provider_id: providerId,
        provider_name: provider.name,
        response_time_ms: responseTime,
        ...result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error testing AI provider:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});