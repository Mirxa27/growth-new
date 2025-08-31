import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProviderConfig {
  provider_type: string;
  api_key: string;
  endpoint_url?: string;
}

async function fetchOpenAIModels(apiKey: string, endpointUrl?: string): Promise<any> {
  const baseUrl = endpointUrl || 'https://api.openai.com/v1';
  
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    models: data.data.map((model: any) => ({
      id: model.id,
      name: model.id,
      description: `OpenAI ${model.id}`,
      capabilities: model.id.includes('gpt') ? ['text', 'chat'] : 
                   model.id.includes('tts') ? ['text-to-speech'] :
                   model.id.includes('whisper') ? ['speech-to-text'] : ['text']
    })),
    voices: [
      { id: 'alloy', name: 'Alloy', description: 'Balanced and natural' },
      { id: 'echo', name: 'Echo', description: 'Warm and engaging' },
      { id: 'fable', name: 'Fable', description: 'Expressive and dynamic' },
      { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
      { id: 'nova', name: 'Nova', description: 'Bright and clear' },
      { id: 'shimmer', name: 'Shimmer', description: 'Soft and gentle' }
    ]
  };
}

async function fetchElevenLabsData(apiKey: string): Promise<any> {
  // Fetch models
  const modelsResponse = await fetch('https://api.elevenlabs.io/v1/models', {
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!modelsResponse.ok) {
    throw new Error(`ElevenLabs API error: ${modelsResponse.statusText}`);
  }

  const modelsData = await modelsResponse.json();

  // Fetch voices
  const voicesResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!voicesResponse.ok) {
    throw new Error(`ElevenLabs API error: ${voicesResponse.statusText}`);
  }

  const voicesData = await voicesResponse.json();

  return {
    models: modelsData.map((model: any) => ({
      id: model.model_id,
      name: model.name,
      description: model.description,
      capabilities: ['text-to-speech', 'voice-conversion']
    })),
    voices: voicesData.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      description: voice.description || `${voice.name} voice`,
      category: voice.category,
      accent: voice.labels?.accent,
      age: voice.labels?.age,
      gender: voice.labels?.gender
    }))
  };
}

async function fetchGoogleVertexData(_apiKey: string): Promise<any> {
  // Google Vertex AI models (static list as they require OAuth)
  return {
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Advanced text generation', capabilities: ['text', 'chat'] },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: 'Multimodal capabilities', capabilities: ['text', 'vision'] },
      { id: 'text-bison', name: 'Text Bison', description: 'Text generation and completion', capabilities: ['text'] },
    ],
    voices: [
      { id: 'en-US-Standard-A', name: 'US English Female A', description: 'Standard US English female voice' },
      { id: 'en-US-Standard-B', name: 'US English Male B', description: 'Standard US English male voice' },
      { id: 'en-US-Wavenet-A', name: 'US English Neural Female A', description: 'High-quality neural voice' },
      { id: 'en-US-Wavenet-B', name: 'US English Neural Male B', description: 'High-quality neural voice' },
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider_type, api_key, endpoint_url }: ProviderConfig = await req.json();

    if (!provider_type || !api_key) {
      throw new Error('Provider type and API key are required');
    }

    console.log(`Fetching data for provider: ${provider_type}`);

    let result;

    switch (provider_type.toLowerCase()) {
      case 'openai':
        result = await fetchOpenAIModels(api_key, endpoint_url);
        break;
      
      case 'elevenlabs':
        result = await fetchElevenLabsData(api_key);
        break;
      
      case 'google':
      case 'vertex':
        result = await fetchGoogleVertexData(api_key);
        break;
      
      default:
        throw new Error(`Unsupported provider type: ${provider_type}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        provider_type,
        ...result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error fetching provider data:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});