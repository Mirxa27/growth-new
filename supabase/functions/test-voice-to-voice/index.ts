import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceTestConfig {
  provider_type: string;
  api_key: string;
  model: string;
  voice: string;
  test_text: string;
  endpoint_url?: string;
}

async function testOpenAIVoice(config: VoiceTestConfig): Promise<any> {
  const { api_key, voice, test_text, endpoint_url } = config;
  const baseUrl = endpoint_url || 'https://api.openai.com/v1';

  // Test text-to-speech
  const ttsResponse = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: test_text,
      voice: voice,
      response_format: 'mp3',
    }),
  });

  if (!ttsResponse.ok) {
    throw new Error(`OpenAI TTS error: ${ttsResponse.statusText}`);
  }

  const audioBuffer = await ttsResponse.arrayBuffer();
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

  return {
    success: true,
    audio_data: base64Audio,
    format: 'mp3',
    duration_estimate: Math.ceil(test_text.length / 10), // rough estimate
    voice_used: voice,
    model_used: 'tts-1'
  };
}

async function testElevenLabsVoice(config: VoiceTestConfig): Promise<any> {
  const { api_key, voice, test_text, model } = config;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: {
      'xi-api-key': api_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: test_text,
      model_id: model || 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

  return {
    success: true,
    audio_data: base64Audio,
    format: 'mp3',
    duration_estimate: Math.ceil(test_text.length / 15),
    voice_used: voice,
    model_used: model || 'eleven_monolingual_v1'
  };
}

async function testGoogleVoice(config: VoiceTestConfig): Promise<any> {
  // For Google Cloud Text-to-Speech, we'd need OAuth setup
  // This is a placeholder implementation
  return {
    success: false,
    error: 'Google Cloud TTS requires OAuth setup. Please use service account credentials.',
    suggestion: 'Consider using OpenAI or ElevenLabs for quick testing.'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const config: VoiceTestConfig = await req.json();

    if (!config.provider_type || !config.api_key || !config.voice || !config.test_text) {
      throw new Error('Provider type, API key, voice, and test text are required');
    }

    console.log(`Testing voice-to-voice for provider: ${config.provider_type}`);

    let result;

    switch (config.provider_type.toLowerCase()) {
      case 'openai':
        result = await testOpenAIVoice(config);
        break;
      
      case 'elevenlabs':
        result = await testElevenLabsVoice(config);
        break;
      
      case 'google':
      case 'vertex':
        result = await testGoogleVoice(config);
        break;
      
      default:
        throw new Error(`Unsupported provider type: ${config.provider_type}`);
    }

    return new Response(
      JSON.stringify({
        test_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        provider: config.provider_type,
        ...result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error testing voice:', error);
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