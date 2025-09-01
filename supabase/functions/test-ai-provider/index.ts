import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { providerId } = await req.json();
    
    if (!providerId) {
      throw new Error('Provider ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch provider configuration
    const { data: provider, error: providerError } = await supabase
      .from('admin_ai_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      throw new Error('Provider not found');
    }

    const config = provider.configuration as any;
    let testResult = { success: false, error: 'Unknown provider type' };

    // Test based on provider type
    switch (provider.provider_type) {
      case 'openai':
        testResult = await testOpenAI(config);
        break;
      case 'anthropic':
        testResult = await testAnthropic(config);
        break;
      case 'google':
        testResult = await testGoogle(config);
        break;
      case 'elevenlabs':
        testResult = await testElevenLabs(config);
        break;
      default:
        testResult = { success: false, error: 'Unsupported provider type' };
    }

    return new Response(
      JSON.stringify(testResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error testing provider:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

async function testOpenAI(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${config.api_key}`
      }
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `OpenAI API error: ${response.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, error: `Failed to connect to OpenAI: ${error}` };
  }
}

async function testAnthropic(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.api_key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      })
    });

    if (response.ok || response.status === 400) {
      // 400 might mean invalid model but API key is valid
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `Anthropic API error: ${response.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, error: `Failed to connect to Anthropic: ${error}` };
  }
}

async function testGoogle(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${config.api_key}`
    );

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `Google API error: ${response.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, error: `Failed to connect to Google: ${error}` };
  }
}

async function testElevenLabs(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': config.api_key
      }
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error: `ElevenLabs API error: ${response.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, error: `Failed to connect to ElevenLabs: ${error}` };
  }
}